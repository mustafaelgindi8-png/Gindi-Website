/*
 * Gindi Innovations — Facebook agent (Cloudflare Worker)
 *
 *   GET  /webhook   Meta's one-time webhook verification
 *   POST /webhook   Messenger messages, echoes, postbacks and Page comments
 *   GET  /leads     Saved leads as JSON (needs ?key=ADMIN_KEY)
 *   GET  /          Health check
 */
import { runAgent, FALLBACK_REPLY_AR } from './agent.js';
import {
  verifySignature,
  sendText,
  sendSenderAction,
  sendPrivateReply,
  replyToComment,
  BOT_METADATA,
} from './facebook.js';
import { COMMENT_PUBLIC_REPLY } from './knowledge.js';

const HISTORY_TURNS = 20; // messages kept per customer (user + assistant)
const HISTORY_TTL = 60 * 60 * 24 * 30; // forget a conversation after 30 days of silence
const SEEN_TTL = 60 * 60 * 24; // ignore Meta's retries of the same event for a day
const SKIP_TOKEN = 'SKIP';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/webhook' && request.method === 'GET') {
      return verifyWebhook(url, env);
    }

    if (url.pathname === '/webhook' && request.method === 'POST') {
      const rawBody = await request.text();
      const ok = await verifySignature(rawBody, request.headers.get('x-hub-signature-256'), env.FB_APP_SECRET);
      if (!ok) return new Response('Invalid signature', { status: 401 });

      let payload;
      try {
        payload = JSON.parse(rawBody);
      } catch {
        return new Response('Bad JSON', { status: 400 });
      }
      if (payload.object !== 'page') return new Response('Ignored', { status: 404 });

      // Answer Meta right away; do the slow work after responding.
      ctx.waitUntil(handlePayload(env, payload));
      return new Response('EVENT_RECEIVED', { status: 200 });
    }

    if (url.pathname === '/leads' && request.method === 'GET') {
      return listLeads(url, env);
    }

    if (url.pathname === '/') {
      return new Response('Gindi Facebook agent is running.', { status: 200 });
    }

    return new Response('Not found', { status: 404 });
  },
};

function verifyWebhook(url, env) {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');
  if (mode === 'subscribe' && env.FB_VERIFY_TOKEN && token === env.FB_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

async function handlePayload(env, payload) {
  const jobs = [];
  for (const entry of payload.entry || []) {
    for (const event of entry.messaging || []) jobs.push(handleMessagingEvent(env, event));
    for (const change of entry.changes || []) jobs.push(handleChange(env, entry.id, change));
  }
  const results = await Promise.allSettled(jobs);
  for (const r of results) if (r.status === 'rejected') console.error('Event failed', r.reason);
}

// ---------------------------------------------------------------- Messenger

async function handleMessagingEvent(env, event) {
  const message = event.message;

  // A message the Page sent. If a person sent it from the inbox (not this agent),
  // pause the agent for that customer so it does not talk over them.
  if (message?.is_echo) {
    if (message.metadata !== BOT_METADATA && event.recipient?.id) {
      await pauseAgent(env, event.recipient.id);
    }
    return;
  }

  const psid = event.sender?.id;
  if (!psid) return;

  let text = null;
  let images = [];
  let notes = [];
  let dedupKey = null;

  if (message) {
    dedupKey = message.mid;
    text = message.text || null;
    for (const att of message.attachments || []) {
      if (att.type === 'image' && att.payload?.url && !att.payload.sticker_id) images.push(att.payload.url);
      else if (att.type === 'image' && att.payload?.sticker_id) notes.push('[The customer sent a sticker]');
      else if (att.type === 'audio') notes.push('[The customer sent a voice note. You cannot listen to it; ask them kindly to type their question]');
      else if (att.type === 'video') notes.push('[The customer sent a video, which you cannot watch]');
      else if (att.type === 'file') notes.push('[The customer sent a file, which you cannot open]');
      else if (att.type === 'location') notes.push('[The customer shared a location]');
    }
  } else if (event.postback) {
    dedupKey = event.postback.mid || null;
    text = event.postback.title || event.postback.payload || 'Get Started';
  } else {
    return; // delivery/read receipts etc.
  }

  if (dedupKey && (await alreadySeen(env, dedupKey))) return;
  if (await isPaused(env, psid)) return;
  if (!text && images.length === 0 && notes.length === 0) return;

  await sendSenderAction(env, psid, 'typing_on');

  const userContent = [];
  for (const imageUrl of images.slice(0, 4)) {
    const block = await imageBlock(imageUrl);
    if (block) userContent.push(block);
    else notes.push('[The customer sent a photo that could not be loaded]');
  }
  const textParts = [...notes, text].filter(Boolean);
  if (images.length && !text) textParts.push('[The customer sent a photo without text]');
  userContent.push({ type: 'text', text: textParts.join('\n') });

  // Text-only version for the stored history.
  const historyText = [images.length ? `[Sent ${images.length} photo(s)]` : null, ...notes, text]
    .filter(Boolean)
    .join('\n');

  await answer(env, psid, userContent, historyText, (reply) => sendText(env, psid, reply), { source: 'messenger' });
}

// ---------------------------------------------------------------- Comments

async function handleChange(env, pageId, change) {
  const v = change.value || {};
  if (change.field !== 'feed' || v.item !== 'comment' || v.verb !== 'add') return;
  if (!v.comment_id || !v.message) return;
  if (v.from?.id === pageId) return; // the Page's own comments
  if (v.parent_id && v.parent_id !== v.post_id) return; // only top-level comments, not reply threads
  if (env.REPLY_TO_COMMENTS === 'false') return;
  if (await alreadySeen(env, v.comment_id)) return;

  const commentText = String(v.message).slice(0, 2000);
  const userContent = [
    {
      type: 'text',
      text:
        `[This is a public comment on one of our Facebook posts. Your reply will be sent to them as a private Messenger message. ` +
        `If the comment does not need a reply (only emojis, tagging friends, a single word like "تم"/"done", or spam), reply with exactly ${SKIP_TOKEN}.]\n\n` +
        commentText,
    },
  ];

  let recipientPsid = null;
  await answer(
    env,
    null,
    userContent,
    `[Commented on a post] ${commentText}`,
    async (reply) => {
      if (reply.trim() === SKIP_TOKEN) return false;
      const res = await sendPrivateReply(env, v.comment_id, reply);
      recipientPsid = res?.recipient_id || null;
      const isArabic = /[؀-ۿ]/.test(commentText);
      await replyToComment(env, v.comment_id, isArabic ? COMMENT_PUBLIC_REPLY.ar : COMMENT_PUBLIC_REPLY.en);
      return true;
    },
    { source: 'comment', commenter: v.from?.name || '', postId: v.post_id, getPsid: () => recipientPsid },
  );
}

// ---------------------------------------------------------------- Shared

/**
 * Runs the agent for one customer turn, sends the reply and updates history.
 * `psid` is null for comments until the private reply reveals it.
 */
async function answer(env, psid, userContent, historyText, send, meta) {
  const history = psid ? await loadHistory(env, psid) : [];
  const leadContext = () => ({ psid: psid || meta.getPsid?.() || '', source: meta.source, commenter: meta.commenter || '' });
  let reply;

  try {
    const result = await runAgent(env, history, userContent, {
      onSaveLead: (lead) => saveLead(env, { ...lead, ...leadContext() }),
      onHandoff: async (info) => {
        if (psid) await pauseAgent(env, psid);
        await notify(env, {
          type: 'handoff',
          ...info,
          ...leadContext(),
          text: `${info.upset ? '⚠️ Upset customer' : '🙋 Customer needs a person'} on Facebook: ${info.reason}`,
        });
      },
    });
    reply = result.reply;
  } catch (err) {
    console.error('Agent failed', err);
    reply = FALLBACK_REPLY_AR;
    await notify(env, { type: 'error', ...leadContext(), text: `Facebook agent could not answer a customer: ${err.message}` });
  }

  const sent = await send(reply);
  if (sent === false) return; // skipped comment

  const key = psid || meta.getPsid?.();
  if (key) {
    const updated = [...history, { role: 'user', content: historyText }, { role: 'assistant', content: reply }];
    await saveHistory(env, key, updated);
  }
}

async function imageBlock(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim();
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > 5 * 1024 * 1024) return null; // API limit per image
    return { type: 'image', source: { type: 'base64', media_type: type, data: toBase64(buf) } };
  } catch (err) {
    console.warn('Image download failed', err.message);
    return null;
  }
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

// ---------------------------------------------------------------- Storage (Workers KV)

async function loadHistory(env, psid) {
  const raw = await env.STORE.get(`conv:${psid}`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function saveHistory(env, psid, history) {
  let trimmed = history.slice(-HISTORY_TURNS);
  while (trimmed.length && trimmed[0].role !== 'user') trimmed = trimmed.slice(1);
  await env.STORE.put(`conv:${psid}`, JSON.stringify(trimmed), { expirationTtl: HISTORY_TTL });
}

async function alreadySeen(env, id) {
  const key = `seen:${id}`;
  if (await env.STORE.get(key)) return true;
  await env.STORE.put(key, '1', { expirationTtl: SEEN_TTL });
  return false;
}

async function pauseAgent(env, psid) {
  const hours = Number(env.HANDOFF_PAUSE_HOURS || 12);
  await env.STORE.put(`pause:${psid}`, '1', { expirationTtl: Math.max(60, Math.round(hours * 3600)) });
}

async function isPaused(env, psid) {
  return Boolean(await env.STORE.get(`pause:${psid}`));
}

async function saveLead(env, lead) {
  const record = { ...lead, createdAt: new Date().toISOString() };
  await env.STORE.put(`lead:${record.createdAt}:${lead.psid || 'unknown'}`, JSON.stringify(record));
  await notify(env, {
    type: 'lead',
    ...record,
    text: `🆕 New Facebook lead: ${lead.name} · ${lead.phone} · ${lead.service}${lead.property ? ` · ${lead.property}` : ''}`,
  });
}

/** Sends an alert to NOTIFY_WEBHOOK_URL (Google Apps Script, Zapier, Make, Slack…), if set. */
async function notify(env, data) {
  if (!env.NOTIFY_WEBHOOK_URL) return;
  try {
    const res = await fetch(env.NOTIFY_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) console.warn('Notify webhook returned', res.status);
  } catch (err) {
    console.warn('Notify webhook failed', err.message);
  }
}

async function listLeads(url, env) {
  const key = url.searchParams.get('key') || '';
  if (!env.ADMIN_KEY || !(await safeEqual(key, env.ADMIN_KEY))) {
    return new Response('Forbidden', { status: 403 });
  }
  const leads = [];
  let cursor;
  do {
    const page = await env.STORE.list({ prefix: 'lead:', cursor });
    for (const k of page.keys) {
      const raw = await env.STORE.get(k.name);
      if (raw) leads.push(JSON.parse(raw));
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  leads.reverse(); // newest first
  return new Response(JSON.stringify(leads, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
