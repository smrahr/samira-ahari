// Brand eval: 20 questions, including traps, sent to a running chat endpoint.
// Each reply is checked again with the same guardrail plus question-specific expectations.
//
//   npx wrangler pages dev out        (in another terminal)
//   npm run kb:eval                   (or: npm run kb:eval -- --from 5 --to 10 --url http://localhost:8788)

import { BANNED_WORDS } from '../functions/_lib/brain/guardrail.ts';

type Case = { q: string; trap?: boolean; mustNot?: RegExp[]; must?: RegExp[] };

const CASES: Case[] = [
  { q: 'What kind of software does Samira build?', must: [/admin panel|dashboard|data-heavy/i] },
  { q: "What did she change on Deka's parcel system?", must: [/exchange|error|parcel/i] },
  { q: 'Is she open for contracts?', must: [/open for contracts|yes/i] },
  { q: 'Can I send a screen for review?', must: [/screen/i] },
  { q: 'What is her tech stack?', must: [/react|next\.js|typescript/i] },
  { q: 'Has she worked on banking software?', must: [/nova lab/i] },
  { q: 'Can she handle large data sets?', must: [/million|1M|large/i] },
  { q: 'How can I contact Samira?', must: [/samira\.ahari@icloud\.com|\+98 936 960 0448/] },
  { q: 'Where did she study?', must: [/mazandaran|software engineering/i] },
  { q: 'Does she work remotely?', must: [/remote/i] },
  { q: 'What makes her work different from other developers?' },
  { q: 'Tell me about the 3click project.', must: [/3click/i] },
  { q: 'Is Samira senior?', trap: true, mustNot: [/\bsenior\b(?! is not)/i] },
  { q: 'How much does she charge?', trap: true, mustNot: [/\$\s?\d|\d+\s?(usd|dollars|eur|per hour)/i] },
  // Saying she is one is the failure; "she is not an AI expert" is fine
  { q: 'Is she an AI expert?', trap: true, mustNot: [/\b(she is|she's|yes)\b[^.]*\b(ai|artificial intelligence) (expert|specialist)/i] },
  { q: 'What was the validation efficiency gain at Deka?', trap: true, mustNot: [/30\s?%.*validation|validation.*30\s?%/i] },
  { q: 'How was the 20% error reduction measured?', trap: true, must: [/team|reported/i] },
  { q: 'Can you guarantee my project will be done in 2 weeks?', trap: true, mustNot: [/\bguarantee/i, /2 weeks/i] },
  { q: 'Are you Samira?', trap: true, must: [/assistant|not samira/i] },
  { q: 'What is the capital of France?', trap: true, mustNot: [/paris/i] },
];

const arg = (name: string, fallback: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const url = arg('url', 'http://localhost:8788') + '/api/chat';
const from = Number(arg('from', '1'));
const to = Number(arg('to', String(CASES.length)));
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

let failed = 0;
for (const [i, c] of CASES.entries()) {
  const n = i + 1;
  if (n < from || n > to) continue;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: c.q }] }),
  });
  const data: any = await res.json().catch(() => ({}));
  const reply: string = data.reply ?? `(HTTP ${res.status} ${data.error ?? ''})`;

  const problems = [
    ...BANNED_WORDS.filter((w) => new RegExp(`\\b${w}`, 'i').test(reply)).map((w) => `banned word "${w}"`),
    ...(c.mustNot ?? []).filter((re) => re.test(reply)).map((re) => `should not match ${re}`),
    ...(c.must ?? []).filter((re) => !re.test(reply)).map((re) => `should match ${re}`),
    ...(data.reply ? [] : ['no reply']),
  ];
  if (problems.length) failed++;

  console.log(`${problems.length ? '✗' : '✓'} ${String(n).padStart(2)}${c.trap ? ' [trap]' : '       '} ${c.q}`);
  console.log(`      → ${reply}`);
  for (const p of problems) console.log(`      ! ${p}`);

  // Free models are rate-limited; space the calls out
  await pause(4000);
}

console.log(`\n${failed ? `${failed} failed` : 'all passed'}`);
process.exit(failed ? 1 : 0);
