# Gindi Innovations — Facebook agent

An AI assistant for the Gindi Innovations Facebook Page, powered by Claude. It:

- **Answers Messenger messages** in Egyptian Arabic or English, about Gindi's services and free calculators.
- **Answers comments on Page posts**: it sends the commenter a private Messenger message and posts a short public reply ("بعتنالك التفاصيل في رسالة خاصة"). It skips comments that need no answer (emojis, tagging friends, "تم").
- **Collects leads**: it asks for name, phone, service and project details, then saves them and alerts you.
- **Hands over to you**: if a customer asks for a person, is upset, or asks about an existing project or payment, it alerts you and goes quiet in that conversation. It also goes quiet automatically when you reply yourself from the Page inbox (for 12 hours by default).
- **Reads photos** customers send. It can't listen to voice notes, so it asks them to type instead.
- Remembers each conversation for 30 days.

It runs as a small Cloudflare Worker, so there's no server to manage.

```
src/knowledge.js   ← What the agent knows: services, contact details, rules. Edit this.
src/agent.js       The Claude call and its two tools (save_lead, handoff_to_human)
src/facebook.js    Facebook Graph API: signature check, sending messages, comment replies
src/index.js       Webhook routing, memory, leads, pauses
wrangler.toml      Worker settings (model, pause hours, comment replies on/off)
test/              Tests that simulate Facebook and Claude (npm test)
```

## Before you start: fill in your details

Open `src/knowledge.js` and fill in `website`, `phone`, `whatsapp`, `email`, `location` and `workingHours`. Anything you leave empty is never mentioned. The agent is told not to invent prices, timelines or contact details, so the more you write here, the more it can answer.

## Setup

You need: the Facebook Page (as an admin), a [Meta developer account](https://developers.facebook.com), a free [Cloudflare account](https://dash.cloudflare.com/sign-up), and a [Claude API key](https://console.anthropic.com).

### 1. Deploy the Worker

```bash
cd facebook-agent
npm install
npx wrangler login
npx wrangler kv namespace create STORE     # paste the id it prints into wrangler.toml
npx wrangler secret put ANTHROPIC_API_KEY
npx wrangler secret put FB_VERIFY_TOKEN    # make up any long random string and keep it for step 3
npm run deploy
```

The deploy prints your address, for example `https://gindi-facebook-agent.<you>.workers.dev`. Opening it should show "Gindi Facebook agent is running."

### 2. Create the Meta app

1. Go to [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Create app**, and choose the use case for **Messenger** (engaging with customers on Messenger).
2. In **App settings → Basic**, copy the **App secret**, then run `npx wrangler secret put FB_APP_SECRET`.
3. In **Messenger → Messenger API settings**, connect the Gindi Page and **generate a Page access token**, then run `npx wrangler secret put FB_PAGE_ACCESS_TOKEN`.
   For a token that never expires, create a *System user* in Meta Business Settings, give it the Page, and generate the token there.

### 3. Connect the webhook

In **Messenger API settings → Webhooks**:

- **Callback URL:** `https://gindi-facebook-agent.<you>.workers.dev/webhook`
- **Verify token:** the same string you set as `FB_VERIFY_TOKEN`
- Under the Page, subscribe to these fields: `messages`, `messaging_postbacks`, `message_echoes`, `feed`

### 4. Test it, then go live

While the app is in **Development** mode, the agent only answers people who have a role on the app (you, plus any testers you add under **App roles**). Message the Page from your own account, and comment on a post, to check it works.

To answer everyone, the app needs **Advanced access** to these permissions, which Meta grants through **App Review**. Meta usually also asks for **Business verification**.

| Permission | Why |
|---|---|
| `pages_messaging` | Reply in Messenger |
| `pages_manage_metadata` | Receive webhooks for the Page |
| `pages_read_engagement`, `pages_read_user_content` | Read comments |
| `pages_manage_engagement` | Reply to comments |

Once approved, switch the app to **Live**.

## Getting leads and alerts

Each new lead is saved, and there are two ways to see them:

- **In the browser:** set a password with `npx wrangler secret put ADMIN_KEY`, then open `https://…workers.dev/leads?key=YOUR_PASSWORD`.
- **In a Google Sheet, as they arrive** (recommended):
  1. Create a Google Sheet → **Extensions → Apps Script**, and paste:
     ```js
     function doPost(e) {
       const d = JSON.parse(e.postData.contents);
       SpreadsheetApp.getActiveSpreadsheet().getSheets()[0].appendRow([
         new Date(), d.type, d.name || d.commenter || '', d.phone || '', d.service || '',
         d.property || '', d.timing || '', d.notes || d.reason || d.text || '', d.psid || '',
       ]);
       return ContentService.createTextOutput('ok');
     }
     ```
  2. **Deploy → New deployment → Web app**, set "Who has access" to **Anyone**, and copy the URL.
  3. Run `npx wrangler secret put NOTIFY_WEBHOOK_URL` and paste that URL.

  Every row has a `type`: `lead`, `handoff` (a customer needs you; `upset` is true if they're angry), or `error` (the agent couldn't answer and sent a polite holding reply instead).

The same URL setting works with Zapier, Make or a Slack incoming webhook. Each alert includes a ready-made `text` line.

## Settings (`wrangler.toml`)

| Setting | Default | Meaning |
|---|---|---|
| `CLAUDE_MODEL` | `claude-opus-5-5` | Claude model. `claude-sonnet-5-5` and `claude-haiku-5-5` are cheaper. |
| `CLAUDE_EFFORT` | `low` | How much the model thinks before replying. `low` is fast and cheap for chat. |
| `HANDOFF_PAUSE_HOURS` | `12` | How long the agent stays quiet after a handoff or after you reply yourself |
| `REPLY_TO_COMMENTS` | `true` | Set to `false` to answer Messenger only |

Run `npm run deploy` after changing anything.

## Costs

- **Cloudflare:** the free plan is fine for testing. For real customers, use Workers Paid (US$5 a month). The free plan allows only 1,000 storage writes a day (each message uses 2–3, so about 400 messages a day), and its 10 ms CPU limit can cut off photo handling.
- **Claude:** each reply sends the instructions and recent conversation, roughly 2,000–4,000 input tokens plus a short answer. On Claude Opus 5.5 that's about US$0.01–0.03 per reply, so about $10–30 per 1,000 replies. This is an estimate, so check your real usage in the Claude Console.
- **Facebook:** replying within 24 hours of a customer's message is free.

## Limits to know

- Facebook allows only **one private reply per comment**, within 7 days of the comment. After the commenter answers, it's a normal Messenger chat.
- The agent replies only within Messenger's 24-hour window after the customer's last message, and it never sends promotions on its own.
- If a customer sends several messages very quickly, each one gets its own reply.

## Local testing

```bash
npm test                       # simulated Facebook + Claude, no accounts needed
cp .dev.vars.example .dev.vars # fill in real values, then:
npm run dev
```
