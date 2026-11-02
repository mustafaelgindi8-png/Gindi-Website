// Runs the Worker end to end with Facebook, Claude and KV simulated.
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import worker from '../src/index.js';
import { splitMessage } from '../src/facebook.js';

const APP_SECRET = 'test-app-secret';
const PAGE_ID = 'PAGE1';

function makeKV() {
  const map = new Map();
  return {
    map,
    async get(k) { return map.has(k) ? map.get(k) : null; },
    async put(k, v) { map.set(k, v); },
    async list({ prefix }) {
      return { keys: [...map.keys()].filter((k) => k.startsWith(prefix)).sort().map((name) => ({ name })), list_complete: true };
    },
  };
}

let env, graphCalls, claudeCalls, notifyCalls, claudeScript;

beforeEach(() => {
  env = {
    STORE: makeKV(),
    ANTHROPIC_API_KEY: 'sk-test',
    FB_PAGE_ACCESS_TOKEN: 'page-token',
    FB_APP_SECRET: APP_SECRET,
    FB_VERIFY_TOKEN: 'verify-me',
    ADMIN_KEY: 'admin',
    NOTIFY_WEBHOOK_URL: 'https://hooks.example.com/notify',
    HANDOFF_PAUSE_HOURS: '12',
  };
  graphCalls = [];
  claudeCalls = [];
  notifyCalls = [];
  claudeScript = [];

  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const body = init.body ?? (input instanceof Request ? await input.clone().text() : undefined);
    if (url.startsWith('https://graph.facebook.com/')) {
      const parsed = JSON.parse(body);
      graphCalls.push({ url, body: parsed });
      const extra = parsed.recipient?.comment_id ? { recipient_id: 'PSID_FROM_COMMENT' } : {};
      return Response.json({ message_id: 'm1', ...extra });
    }
    if (url.startsWith('https://api.anthropic.com/')) {
      const parsed = JSON.parse(body);
      claudeCalls.push({ url, headers: init.headers, body: parsed });
      const next = claudeScript.shift();
      if (!next) throw new Error('Unexpected Claude call');
      return Response.json({
        id: 'msg_' + claudeCalls.length, type: 'message', role: 'assistant', model: parsed.model,
        stop_reason: next.stop_reason || 'end_turn', stop_sequence: null,
        content: next.content, usage: { input_tokens: 10, output_tokens: 10 },
      });
    }
    if (url === env.NOTIFY_WEBHOOK_URL) {
      notifyCalls.push(JSON.parse(body));
      return new Response('ok');
    }
    throw new Error('Unexpected fetch ' + url);
  };
});

function sign(body, secret = APP_SECRET) {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

async function post(payload, signature) {
  const body = JSON.stringify(payload);
  const waits = [];
  const res = await worker.fetch(
    new Request('https://agent.example.com/webhook', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature ?? sign(body) },
      body,
    }),
    env,
    { waitUntil: (p) => waits.push(p) },
  );
  await Promise.all(waits);
  return res;
}

const textReply = (text) => ({ content: [{ type: 'text', text }] });
const messengerText = (psid, mid, text) => ({
  object: 'page',
  entry: [{ id: PAGE_ID, time: 1, messaging: [{ sender: { id: psid }, recipient: { id: PAGE_ID }, message: { mid, text } }] }],
});
const sentTexts = () => graphCalls.filter((c) => c.body.message?.text).map((c) => c.body.message.text);

test('webhook verification echoes the challenge only with the right token', async () => {
  const ok = await worker.fetch(new Request('https://a.example.com/webhook?hub.mode=subscribe&hub.verify_token=verify-me&hub.challenge=123'), env, {});
  assert.equal(ok.status, 200);
  assert.equal(await ok.text(), '123');
  const bad = await worker.fetch(new Request('https://a.example.com/webhook?hub.mode=subscribe&hub.verify_token=nope&hub.challenge=123'), env, {});
  assert.equal(bad.status, 403);
});

test('rejects posts with a wrong signature', async () => {
  const res = await post(messengerText('U1', 'mid.1', 'hi'), sign('something else'));
  assert.equal(res.status, 401);
  assert.equal(claudeCalls.length, 0);
});

test('answers a Messenger message and remembers the conversation', async () => {
  claudeScript.push(textReply('أهلاً بيك! تحب نساعدك في إيه؟'));
  const res = await post(messengerText('U1', 'mid.1', 'السلام عليكم'));
  assert.equal(res.status, 200);

  assert.equal(claudeCalls.length, 1);
  const req = claudeCalls[0].body;
  assert.equal(req.model, 'claude-opus-5-5');
  assert.equal(req.fallbacks, 'default');
  assert.deepEqual(req.output_config, { effort: 'low' });
  assert.equal(req.thinking, undefined);
  assert.equal(req.temperature, undefined);
  assert.match(req.system[0].text, /Gindi Innovations/);
  assert.deepEqual(req.messages, [{ role: 'user', content: [{ type: 'text', text: 'السلام عليكم' }] }]);

  const typing = graphCalls.find((c) => c.body.sender_action === 'typing_on');
  assert.ok(typing);
  assert.deepEqual(sentTexts(), ['أهلاً بيك! تحب نساعدك في إيه؟']);
  assert.equal(graphCalls.at(-1).body.recipient.id, 'U1');

  // Second message carries the history.
  claudeScript.push(textReply('تمام، المساحة كام متر؟'));
  await post(messengerText('U1', 'mid.2', 'عايز أشطب شقة'));
  assert.deepEqual(claudeCalls[1].body.messages.map((m) => m.role), ['user', 'assistant', 'user']);
  assert.equal(claudeCalls[1].body.messages[1].content, 'أهلاً بيك! تحب نساعدك في إيه؟');
});

test('ignores a repeated delivery of the same message', async () => {
  claudeScript.push(textReply('hi'));
  await post(messengerText('U1', 'mid.dup', 'hello'));
  await post(messengerText('U1', 'mid.dup', 'hello'));
  assert.equal(claudeCalls.length, 1);
});

test('saves a lead through the tool and notifies the team', async () => {
  claudeScript.push({
    stop_reason: 'tool_use',
    content: [{
      type: 'tool_use', id: 'tu1', name: 'save_lead',
      input: { name: 'Ahmed', phone: '01000000000', service: 'Finishing & Fit-Out', property: 'Apartment 150 m², New Cairo', timing: 'next month', notes: 'Full finishing' },
    }],
  });
  claudeScript.push(textReply('تمام يا أحمد، فريقنا هيكلمك قريب.'));
  await post(messengerText('U2', 'mid.3', 'اسمي أحمد 01000000000 تشطيب شقة 150 متر التجمع'));

  assert.equal(claudeCalls.length, 2);
  const second = claudeCalls[1].body.messages;
  assert.equal(second.at(-1).content[0].type, 'tool_result');
  assert.equal(second.at(-1).content[0].tool_use_id, 'tu1');

  const leadKeys = [...env.STORE.map.keys()].filter((k) => k.startsWith('lead:'));
  assert.equal(leadKeys.length, 1);
  const lead = JSON.parse(env.STORE.map.get(leadKeys[0]));
  assert.equal(lead.phone, '01000000000');
  assert.equal(lead.psid, 'U2');
  assert.equal(notifyCalls[0].type, 'lead');
  assert.deepEqual(sentTexts(), ['تمام يا أحمد، فريقنا هيكلمك قريب.']);

  const leads = await worker.fetch(new Request('https://a.example.com/leads?key=admin'), env, {});
  assert.equal((await leads.json())[0].name, 'Ahmed');
  const denied = await worker.fetch(new Request('https://a.example.com/leads?key=wrong'), env, {});
  assert.equal(denied.status, 403);
});

test('handoff pauses the agent for that customer', async () => {
  claudeScript.push({
    stop_reason: 'tool_use',
    content: [{ type: 'tool_use', id: 'tu2', name: 'handoff_to_human', input: { reason: 'Complaint about delay', upset: true } }],
  });
  claudeScript.push(textReply('آسفين جداً، حد من الفريق هيرد عليك هنا حالاً.'));
  await post(messengerText('U3', 'mid.4', 'انتو اتأخرتوا جداً في الشغل!!'));
  assert.equal(notifyCalls[0].type, 'handoff');
  assert.equal(notifyCalls[0].upset, true);
  assert.ok(env.STORE.map.get('pause:U3'));

  await post(messengerText('U3', 'mid.5', 'فين حد يرد؟'));
  assert.equal(claudeCalls.length, 2); // no new Claude call while paused
});

test('a human reply from the Page inbox pauses the agent; its own echoes do not', async () => {
  const echo = (metadata) => ({
    object: 'page',
    entry: [{ id: PAGE_ID, messaging: [{ sender: { id: PAGE_ID }, recipient: { id: 'U4' }, message: { mid: 'e' + Math.random(), is_echo: true, text: 'x', metadata } }] }],
  });
  await post(echo('gindi-agent'));
  assert.equal(env.STORE.map.get('pause:U4'), undefined);
  await post(echo(undefined));
  assert.ok(env.STORE.map.get('pause:U4'));
});

test('a post comment gets a private reply and a short public reply', async () => {
  claudeScript.push(textReply('أهلاً بيك! التشطيب بيعتمد على المساحة والخامات. تحب تبعتلي المساحة والمكان؟'));
  await post({
    object: 'page',
    entry: [{ id: PAGE_ID, changes: [{ field: 'feed', value: { item: 'comment', verb: 'add', comment_id: 'C1', post_id: 'P1', parent_id: 'P1', from: { id: 'X1', name: 'Mona' }, message: 'بكام تشطيب الشقة؟' } }] }],
  });
  const privateReply = graphCalls.find((c) => c.body.recipient?.comment_id === 'C1');
  assert.ok(privateReply);
  const publicReply = graphCalls.find((c) => c.url.endsWith('/C1/comments'));
  assert.equal(publicReply.body.message, 'أهلاً بيك 🌿 بعتنالك التفاصيل في رسالة خاصة.');
  // History is stored under the PSID returned by the private reply, so the Messenger chat continues.
  assert.ok(env.STORE.map.get('conv:PSID_FROM_COMMENT'));
});

test('skips comments that need no reply and the Page’s own comments', async () => {
  claudeScript.push(textReply('SKIP'));
  const comment = (from, id) => ({
    object: 'page',
    entry: [{ id: PAGE_ID, changes: [{ field: 'feed', value: { item: 'comment', verb: 'add', comment_id: id, post_id: 'P1', parent_id: 'P1', from: { id: from }, message: '😍😍' } }] }],
  });
  await post(comment('X2', 'C2'));
  assert.equal(claudeCalls.length, 1);
  assert.equal(graphCalls.length, 0);

  await post(comment(PAGE_ID, 'C3'));
  assert.equal(claudeCalls.length, 1);
});

test('if Claude fails, the customer still gets a polite reply and the team is alerted', async () => {
  // No scripted reply -> the simulated Claude call throws.
  await post(messengerText('U5', 'mid.6', 'hello'));
  assert.equal(sentTexts().length, 1);
  assert.match(sentTexts()[0], /فريقنا/);
  assert.equal(notifyCalls.at(-1).type, 'error');
});

test('long replies are split under the Messenger limit', () => {
  const long = ('جملة طويلة شوية. ').repeat(300);
  const parts = splitMessage(long);
  assert.ok(parts.length > 1);
  for (const p of parts) assert.ok(p.length <= 2000);
  assert.equal(parts.join(' ').replace(/\s+/g, ' ').trim(), long.replace(/\s+/g, ' ').trim());
});
