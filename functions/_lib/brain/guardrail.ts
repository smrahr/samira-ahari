// Output post-check against the brand rules (Brand Guide v3, sections 08 and 16).
// Pure functions, so they can be tested without network or database.

import { CONTACT } from './config.ts';

export const BANNED_WORDS = [
  'leverage',
  'seamless',
  'synergy',
  'cutting-edge',
  'world-class',
  'amazing',
  'guaranteed',
  'revolutionary',
  'AI-powered',
  'intelligent',
  'interfaces that think',
  'pixel-perfect',
];

// Catches inflections too: leveraged, seamlessly, guarantees…
const BANNED_PATTERNS: [string, RegExp][] = BANNED_WORDS.map((word) => [
  word,
  new RegExp(`\\b${word.replace(/-/g, '[- ]').replace(/(leverag|seamless|guarantee)\w*$/, '$1\\w*')}\\b`, 'i'),
]);

// "20%", "20 percent", "1M", "1 million", "1,000,000", "14" — but not the 3 in "3click" or the 2 in "B2B"
const NUMBER = /(?<![\w.])(\d[\d,]*(?:\.\d+)?)(?:\s*(%|percent\b|million\b)|(m|k)\b)?(?![\w%])/gi;

const NUMBER_WORDS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, twenty: 20,
};

type ParsedNumber = { raw: string; value: number; isMetric: boolean };

function parseNumbers(text: string): ParsedNumber[] {
  const out: ParsedNumber[] = [];
  for (const m of text.matchAll(NUMBER)) {
    const base = parseFloat(m[1].replace(/,/g, ''));
    const unit = (m[2] ?? m[3] ?? '').toLowerCase();
    const scale = unit === 'million' || unit === 'm' ? 1_000_000 : unit === 'k' ? 1_000 : 1;
    out.push({ raw: m[0].trim(), value: base * scale, isMetric: unit !== '' });
  }
  return out;
}

// "a team of fourteen" in the sources makes "a team of 14" in a reply fine
const wordCounts = (text: string) =>
  [...text.toLowerCase().matchAll(/\b[a-z]+\b/g)].map((m) => NUMBER_WORDS[m[0]]).filter((n) => n !== undefined);

const isYear = (n: ParsedNumber) => !n.isMetric && n.value >= 1990 && n.value <= 2035;

// Values a reply may contain: every number in the proof bank, plus plain counts that appear in
// the retrieved context. Results (%, million) must come from the proof bank itself.
export type ProofItem = { value: string; label: string; project: string; team_credit: string | null };

// The word a visitor would recognise a project by: "Deka", "3click", "Lipack", "Netpeaksell"
const projectKeyword = (project: string) => project.split(/\s+/)[0].toLowerCase();

export function allowedNumbers(proofs: ProofItem[], contextText: string) {
  // metric value → project keywords it may be quoted with
  const metrics = new Map<number, Set<string>>();
  const counts = new Set<number>();
  for (const p of proofs) {
    for (const n of parseNumbers(`${p.value} ${p.label} ${p.team_credit ?? ''} ${p.project}`)) {
      if (!n.isMetric) {
        counts.add(n.value);
        continue;
      }
      if (!metrics.has(n.value)) metrics.set(n.value, new Set());
      metrics.get(n.value)!.add(projectKeyword(p.project));
    }
  }
  for (const n of parseNumbers(contextText)) if (!n.isMetric) counts.add(n.value);
  const words = [...proofs.map((p) => `${p.label} ${p.team_credit ?? ''}`), contextText].join(' ');
  for (const n of wordCounts(words)) counts.add(n);
  return { metrics, counts };
}

const sentences = (text: string) => text.split(/(?<=[.!?])\s+/);

export function checkReply(reply: string, allowed: ReturnType<typeof allowedNumbers>): string[] {
  const flags: string[] = [];

  for (const [word, pattern] of BANNED_PATTERNS) {
    if (pattern.test(reply)) flags.push(`banned_word:${word}`);
  }
  if (/\bsenior\b/i.test(reply)) flags.push('senior');

  // Contact details are allowed numbers by definition
  const scannable = reply.replace(CONTACT.phone, ' ').replace(CONTACT.email, ' ');
  for (const sentence of sentences(scannable)) {
    const lower = sentence.toLowerCase();
    for (const n of parseNumbers(sentence)) {
      if (isYear(n)) continue;
      if (!n.isMetric) {
        if (!allowed.counts.has(n.value)) flags.push(`unapproved_number:${n.raw}`);
        continue;
      }
      const projects = allowed.metrics.get(n.value);
      if (!projects) flags.push(`unapproved_number:${n.raw}`);
      // Brand guide 08, rule 1: a result is always quoted with its project
      else if (![...projects].some((k) => lower.includes(k))) flags.push(`number_without_project:${n.raw}`);
    }
  }

  return [...new Set(flags)];
}

// Replies render as plain handwritten notes, so markdown left by the model is removed
export const toPlainText = (text: string) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(\S.*?)\*/g, '$1$2')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/`([^`]+)`/g, '$1')
    // One note is one paragraph
    .replace(/\s*\n+\s*/g, ' ')
    .trim();
