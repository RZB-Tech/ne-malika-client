"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "@/components/icons";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

const FADE = "linear-gradient(to bottom, #000 calc(100% - 4rem), transparent)";

/**
 * Длинный текст, свёрнутый до нескольких строк, с кнопкой «Показать полностью».
 *
 * Обрезка идёт по max-height с первого кадра, а не после замера: короткий текст
 * и так ниже порога, поэтому для него ограничение — пустая операция, а длинный
 * не успевает мигнуть целиком и схлопнуться. Кнопка и градиент появляются уже
 * после замера, когда ясно, что текст действительно не помещается.
 *
 * Текст всегда остаётся в разметке целиком — свёрнутое состояние чисто
 * визуальное. Поисковики видят описание полностью, и страницы магазинов,
 * собранные статически, ничего не теряют.
 */
export function Expandable({
  children,
  className,
  contentClassName,
  collapsedHeight = 224,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  collapsedHeight?: number;
}) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  const [full, setFull] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => setFull(el.scrollHeight);
    measure();

    // Высота меняется от подгрузки шрифтов и смены ширины окна — без наблюдателя
    // кнопка осталась бы там, где текст уже помещается (или наоборот).
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children]);

  // Запас в 24px: ради одной недостающей строки прятать текст незачем.
  const overflows = full !== null && full > collapsedHeight + 24;
  const clipped = overflows && !expanded;

  return (
    <div className={className}>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-out motion-reduce:transition-none"
        style={{
          maxHeight: expanded ? (full ?? undefined) : collapsedHeight,
          // Затухание маской, а не градиентом поверх: градиенту нужен цвет
          // подложки, а компонент стоит и на фоне страницы, и внутри карточек.
          ...(clipped ? { maskImage: FADE, WebkitMaskImage: FADE } : null),
        }}
      >
        <div ref={ref} className={contentClassName}>
          {children}
        </div>
      </div>

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className={cn(
            "mt-2 inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary",
            "transition-colors hover:text-primary/80",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
          )}
        >
          {expanded ? t("common.showLess") : t("common.showMore")}
          <ChevronDown
            className={cn(
              "size-4 transition-transform duration-300 motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
          />
        </button>
      )}
    </div>
  );
}
