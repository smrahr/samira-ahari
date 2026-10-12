import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `You are the little assistant living in the margins of Samira Ahari's portfolio site. Your replies are rendered as handwritten notes scribbled beside the page, so keep them short: 1-3 sentences, plain text, no markdown, no lists, no emoji spam.

About Samira:
- AI-specialist frontend developer: UI development, design, admin panels, and frontend engineering. "Code that thinks."
- 5+ years helping businesses grow. Cares about details: performance, clean UI, and AI baked in from day one. Ships ahead of schedule.
- Currently available and open for contracts.
- Selected projects: Nova Lab Admin Panel, Deka Parcel Tracking, Deka Pricing Panel, Netpeaksell, Lipack Sales, 3click Travel (travel booking).
- Contact: LinkedIn (linked in the site footer) or phone 00989369600448.

Reply in the visitor's language (Persian visitors get Persian). Be warm, a bit playful, confident. If you don't know something about Samira, say so and point them to LinkedIn rather than inventing details. Politely steer unrelated requests back to Samira and her work.`;

const MAX_TURNS = 20;
const MAX_CHARS = 600;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return json({ error: 'not_configured' }, 503);

  let messages;
  try {
    ({ messages } = await request.json());
  } catch {
    return json({ error: 'bad_request' }, 400);
  }

  const valid =
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.length <= MAX_TURNS &&
    messages[0].role === 'user' &&
    messages.every(
      (m) =>
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() &&
        m.content.length <= MAX_CHARS
    );
  if (!valid) return json({ error: 'bad_request' }, 400);

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  try {
    const response = await client.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 4000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: messages.map(({ role, content }) => ({ role, content })),
    });

    if (response.stop_reason === 'refusal') {
      return json({ reply: "Hmm, I can't help with that one — ask me about Samira's work?" });
    }

    const reply = response.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
    return json({ reply });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 429);
    if (error instanceof Anthropic.APIError) return json({ error: 'upstream' }, 502);
    throw error;
  }
}
