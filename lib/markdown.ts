/**
 * Разбор описания товара, размеченного markdown.
 *
 * Свой разбор, а не библиотека: поддержать надо ровно три вещи — абзацы,
 * списки и жирный текст, — а любой полноценный парсер тянет за собой заголовки,
 * таблицы, HTML и ссылки. Ссылки и HTML в описании товара нам прямо не нужны:
 * телефоны и переходы «в директ» — то, за что модерация снимает объявление.
 *
 * Разбор возвращает данные, а не строку с HTML: рисует их React, поэтому
 * подставить в описание разметку невозможно в принципе.
 */

export interface MarkdownText {
  text: string;
  bold: boolean;
}

export type MarkdownBlock =
  | { kind: "paragraph"; lines: MarkdownText[][] }
  | { kind: "list"; items: MarkdownText[][] };

/** Строка списка: «- пункт», «* пункт» или «1. пункт». */
const LIST_ITEM = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

/** Заголовки и цитаты моделью запрещены, но продавец может их набрать сам. */
const LINE_PREFIX = /^\s*(?:#{1,6}|>)\s*/;

export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];

  // Пустая строка разделяет абзацы; внутри абзаца перевод строки сохраняется —
  // продавцы часто пишут по строке на характеристику.
  for (const chunk of source.replace(/\r\n/g, "\n").split(/\n{2,}/)) {
    const lines = chunk.split("\n").filter((line) => line.trim().length > 0);
    if (lines.length === 0) continue;

    // Список — если хотя бы одна строка куска начинается с маркера. Смешанный
    // кусок («вводная строка, потом пункты») тоже станет списком: вводную
    // строку показать пунктом честнее, чем потерять.
    if (lines.some((line) => LIST_ITEM.test(line))) {
      const items = lines.map((line) =>
        parseInline(clean(LIST_ITEM.exec(line)?.[1] ?? line)),
      );
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

/** Убирает разметку, которую мы не рисуем, оставляя её содержимое. */
function clean(line: string): string {
  return (
    line
      .replace(LINE_PREFIX, "")
      // Ссылку показываем подписью: адрес в описании товара всё равно вне правил.
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/`+/g, "")
      .trim()
  );
}

/**
 * Жирный текст. `**так**` и `__так__`; одиночная звёздочка не курсив
 * намеренно — в размерах и артикулах («5*5 см») она встречается чаще, чем
 * в разметке.
 */
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

/**
 * Текст без разметки — для описания страницы в поиске и для schema.org.
 * Краулеру звёздочки и дефисы списка не нужны, а место в сниппете занимают.
 */
export function markdownToPlainText(source: string): string {
  return parseMarkdown(source)
    .flatMap((block) =>
      block.kind === "list"
        ? block.items.map(join)
        : block.lines.map(join),
    )
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function join(parts: MarkdownText[]): string {
  return parts.map((p) => p.text).join("");
}
