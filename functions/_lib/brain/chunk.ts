// Splits a markdown document into overlapping chunks along paragraph boundaries.

import { CHUNK_CHARS, CHUNK_OVERLAP_CHARS } from './config.ts';

export type Chunk = { content: string; index: number; tokenCount: number };

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

// One chunk per "## " section — for documents like the FAQ where every section is a separate question
export function chunkSections(title: string, body: string): Chunk[] {
  return body
    .split(/^(?=## )/m)
    .map((s) => s.trim())
    .filter((s) => s.startsWith('## '))
    .map((section, index) => {
      const content = `# ${title}\n\n${section}`;
      return { content, index, tokenCount: estimateTokens(content) };
    });
}

export function chunkText(
  title: string,
  body: string,
  maxChars = CHUNK_CHARS,
  overlapChars = CHUNK_OVERLAP_CHARS
): Chunk[] {
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const pieces: string[] = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if (current && current.length + paragraph.length + 2 > maxChars) {
      pieces.push(current);
      // Carry the tail of the previous chunk so an idea split across chunks keeps its context
      current = current.slice(-overlapChars).replace(/^\S*\s/, '') + '\n\n' + paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) pieces.push(current);

  // Every chunk starts with the document title so it still makes sense on its own
  return pieces.map((piece, index) => {
    const content = piece.startsWith('# ') ? piece : `# ${title}\n\n${piece}`;
    return { content, index, tokenCount: estimateTokens(content) };
  });
}
