export interface MarkdownText {
  text: string;
  bold: boolean;
}

export type MarkdownBlock =
  { kind: "paragraph"; lines: MarkdownText[][] } | { kind: "list"; items: MarkdownText[][] };

const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

const LINE_PREFIX = /^\s*(?:#{1,6}|>)\s*/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];

  for (const chunk of source.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;

    if (lines.some((line) => LIST_ITEM.test(line))) {
      const items = lines.map((line) => parseInline(clean(LIST_ITEM.exec(line)?.[1] ?? line)));
      blocks.push({ kind: "list", items });
      continue;
    }

    blocks.push({
      kind: "paragraph",
      lines: lines.map((line) => parseInline(clean(line))),
    });
  }

  return blocks;
}

function clean(line: string): string {
  return line
    .replace(LINE_PREFIX, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/`+/g, "")
    .trim();
}

function parseInline(line: string): MarkdownText[] {
  const parts: MarkdownText[] = [];
  const pattern = /\*\*(.+?)\*\*|__(.+?)__/g;
  let last = 0;

  for (let m = pattern.exec(line); m !== null; m = pattern.exec(line)) {
    if (m.index > last) {
      parts.push({ text: line.slice(last, m.index), bold: false });
    }
    parts.push({ text: m[1] ?? m[2] ?? "", bold: true });
    last = m.index + m[0].length;
  }
  if (last < line.length) parts.push({ text: line.slice(last), bold: false });

  return parts.length > 0 ? parts : [{ text: line, bold: false }];
}

export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .flatMap((block) => (block.kind === "list" ? block.items.map(join) : block.lines.map(join)))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function join(parts: MarkdownText[]): string {
  return parts.map((p) => p.text).join("");
}
