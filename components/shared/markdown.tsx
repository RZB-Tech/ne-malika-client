import { parseMarkdown, type MarkdownText } from "@/lib/markdown";
import { cn } from "@/lib/utils";

/**
 * Описание товара с простой разметкой: абзацы, списки и жирный текст.
 *
 * Рисуется React-элементами, а не через dangerouslySetInnerHTML: описание
 * пишут продавцы и правит модель, и единственный способ гарантировать, что
 * оттуда не приедет разметка, — вообще не собирать HTML из строки.
 */
export function Markdown({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const blocks = parseMarkdown(text);
  if (blocks.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.map((block, i) =>
        block.kind === "list" ? (
          <ul key={i} className="space-y-1.5 pl-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex gap-2.5">
                <span
                  aria-hidden
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                />
                <span className="min-w-0">
                  <Inline parts={item} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            {block.lines.map((line, j) => (
              <span key={j}>
                {j > 0 && <br />}
                <Inline parts={line} />
              </span>
            ))}
          </p>
        ),
      )}
    </div>
  );
}

function Inline({ parts }: { parts: MarkdownText[] }) {
  return (
    <>
      {parts.map((part, i) =>
        part.bold ? (
          <strong key={i} className="font-semibold text-foreground">
            {part.text}
          </strong>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}
