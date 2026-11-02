/*
 * The Claude agent: one customer turn in, one reply out.
 * Tools let it save a lead or hand the conversation to a person.
 */
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './knowledge.js';

const SYSTEM_PROMPT = buildSystemPrompt();
const MAX_TOOL_ROUNDS = 4;

export const FALLBACK_REPLY_AR =
  'شكراً لرسالتك 🌿 حد من فريقنا هيرد عليك هنا في أقرب وقت.';

const TOOLS = [
  {
    name: 'save_lead',
    description:
      'Save an interested customer so the team can contact them with a quotation or to book a consultation. Call it once you have at least their name, phone number and the service they need. Use an empty string for anything you do not know yet.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string', description: 'Customer name' },
        phone: { type: 'string', description: 'Phone number as the customer wrote it' },
        service: { type: 'string', description: 'Service they need, e.g. Interior Design, Finishing & Fit-Out' },
        property: { type: 'string', description: 'Property type, area in m² and location, if given' },
        timing: { type: 'string', description: 'When they want to start, if given' },
        notes: { type: 'string', description: 'Short summary of what they want, in English' },
      },
      required: ['name', 'phone', 'service', 'property', 'timing', 'notes'],
    },
  },
  {
    name: 'handoff_to_human',
    description:
      'Pause the assistant in this conversation and alert the team so a person replies. Use when the customer asks for a person, is upset or complaining, asks about an existing project, payment or contract, or you cannot help.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        reason: { type: 'string', description: 'Why a person is needed, in one short English sentence' },
        upset: { type: 'boolean', description: 'True if the customer seems upset or angry' },
      },
      required: ['reason', 'upset'],
    },
  },
];

function textOf(content) {
  return content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

/**
 * @param {object} env  Worker environment (secrets and settings)
 * @param {Array<{role: 'user'|'assistant', content: string}>} history  Earlier turns, text only
 * @param {Array<object>} userContent  Content blocks for the new customer turn
 * @param {{ onSaveLead: (lead: object) => Promise<void>, onHandoff: (info: object) => Promise<void> }} actions
 * @returns {Promise<{ reply: string, handedOff: boolean }>}
 */
export async function runAgent(env, history, userContent, actions) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 2, timeout: 25_000 });
  const messages = [...history, { role: 'user', content: userContent }];
  let handedOff = false;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await client.beta.messages.create({
      model: env.CLAUDE_MODEL || 'claude-opus-5-5',
      max_tokens: 16000,
      // Short chat replies: low effort keeps them fast and cheap.
      output_config: { effort: env.CLAUDE_EFFORT || 'low' },
      // If a safety classifier declines, the API retries on a suitable model instead of refusing.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: TOOLS,
      messages,
    });

    if (response.stop_reason === 'refusal') {
      console.warn('Request declined', response.stop_details);
      return { reply: FALLBACK_REPLY_AR, handedOff };
    }

    const toolUses = response.content.filter((b) => b.type === 'tool_use');
    if (response.stop_reason !== 'tool_use' || toolUses.length === 0) {
      return { reply: textOf(response.content) || FALLBACK_REPLY_AR, handedOff };
    }

    // Run every tool call, then return all results in one user message.
    messages.push({ role: 'assistant', content: response.content });
    const results = [];
    for (const call of toolUses) {
      try {
        if (call.name === 'save_lead') {
          await actions.onSaveLead(call.input);
          results.push({ type: 'tool_result', tool_use_id: call.id, content: 'Saved. The team will contact the customer.' });
        } else if (call.name === 'handoff_to_human') {
          await actions.onHandoff(call.input);
          handedOff = true;
          results.push({ type: 'tool_result', tool_use_id: call.id, content: 'The team has been alerted and the assistant is paused for this customer.' });
        } else {
          results.push({ type: 'tool_result', tool_use_id: call.id, content: `Unknown tool ${call.name}`, is_error: true });
        }
      } catch (err) {
        console.error(`Tool ${call.name} failed`, err);
        results.push({ type: 'tool_result', tool_use_id: call.id, content: 'This action failed. Tell the customer the team will follow up.', is_error: true });
      }
    }
    messages.push({ role: 'user', content: results });
  }

  return { reply: FALLBACK_REPLY_AR, handedOff };
}
