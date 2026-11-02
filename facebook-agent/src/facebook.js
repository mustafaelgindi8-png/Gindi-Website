/*
 * Facebook Graph API helpers: webhook signature check, Messenger Send API,
 * and comment replies.
 */

const MAX_MESSAGE_CHARS = 2000; // Messenger text limit

function graphUrl(env, path) {
  const version = env.GRAPH_API_VERSION || 'v24.0';
  return `https://graph.facebook.com/${version}/${path}`;
}

async function graphPost(env, path, body) {
  const res = await fetch(graphUrl(env, path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.FB_PAGE_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Graph API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

/**
 * Checks the X-Hub-Signature-256 header against the raw request body,
 * using the app secret. Rejects anything that did not come from Meta.
 */
export async function verifySignature(rawBody, signatureHeader, appSecret) {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=') || !appSecret) return false;
  const expectedHex = signatureHeader.slice('sha256='.length);
  if (!/^[0-9a-f]{64}$/i.test(expectedHex)) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(appSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify'],
  );
  const expected = new Uint8Array(expectedHex.match(/../g).map((h) => parseInt(h, 16)));
  // crypto.subtle.verify compares in constant time.
  return crypto.subtle.verify('HMAC', key, expected, new TextEncoder().encode(rawBody));
}

/** Splits text into chunks Messenger accepts, preferring paragraph and sentence breaks. */
export function splitMessage(text, max = MAX_MESSAGE_CHARS) {
  const chunks = [];
  let rest = text.trim();
  while (rest.length > max) {
    const window = rest.slice(0, max);
    let cut = Math.max(window.lastIndexOf('\n\n'), window.lastIndexOf('\n'));
    if (cut < max * 0.5) cut = Math.max(window.lastIndexOf('. '), window.lastIndexOf('؟ '), window.lastIndexOf('! '));
    if (cut < max * 0.5) cut = window.lastIndexOf(' ');
    if (cut <= 0) cut = max - 1;
    chunks.push(rest.slice(0, cut + 1).trim());
    rest = rest.slice(cut + 1).trim();
  }
  if (rest) chunks.push(rest);
  return chunks;
}

// Marks messages sent by this agent, so echoes of them are not mistaken for a human reply.
export const BOT_METADATA = 'gindi-agent';

export async function sendText(env, recipientId, text) {
  for (const chunk of splitMessage(text)) {
    await graphPost(env, 'me/messages', {
      recipient: { id: recipientId },
      messaging_type: 'RESPONSE',
      message: { text: chunk, metadata: BOT_METADATA },
    });
  }
}

export async function sendSenderAction(env, recipientId, action) {
  try {
    await graphPost(env, 'me/messages', { recipient: { id: recipientId }, sender_action: action });
  } catch (err) {
    console.warn('sender_action failed', err.message); // cosmetic only
  }
}

/** Private reply to a comment: opens a Messenger conversation with the commenter (once per comment). */
export async function sendPrivateReply(env, commentId, text) {
  const [first, ...more] = splitMessage(text);
  const res = await graphPost(env, 'me/messages', {
    recipient: { comment_id: commentId },
    message: { text: first, metadata: BOT_METADATA },
  });
  // After the first private reply, the conversation is a normal thread with the user.
  if (more.length && res.recipient_id) {
    for (const chunk of more) {
      await graphPost(env, 'me/messages', {
        recipient: { id: res.recipient_id },
        messaging_type: 'RESPONSE',
        message: { text: chunk, metadata: BOT_METADATA },
      });
    }
  }
  return res;
}

/** Public reply under a comment. */
export async function replyToComment(env, commentId, text) {
  return graphPost(env, `${commentId}/comments`, { message: text });
}
