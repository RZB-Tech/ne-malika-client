"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
} as const;

/**
 * Оценка звёздами.
 *
 * Дробная часть показывается частично закрашенной звездой, а не округляется:
 * между 4,4 и 4,6 для покупателя есть разница, а четыре с половиной звезды
 * читаются с одного взгляда — цифру рядом ещё надо прочесть.
 */
export function RatingStars({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const icon = SIZES[size];

  return (
    <span
      className={cn("inline-flex items-center gap-0.5", className)}
      aria-hidden
    >
      {[1, 2, 3, 4, 5].map((position) => {
        // Доля закраски этой звезды: 1 — целиком, 0 — пустая.
        const fill = Math.min(1, Math.max(0, value - position + 1));
        return (
          <span key={position} className="relative inline-flex">
            <Star className={cn(icon, "text-muted-foreground/35")} />
            {fill > 0 && (
              // Обрезка по ширине, а не половинчатая иконка: так одинаково
              // выглядит любая дробь, включая 4,3.
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={cn(icon, "fill-amber-400 text-amber-400")}
                />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

/**
 * Выбор оценки. Отдельный компонент, а не режим RatingStars: у ввода своя
 * разметка — это пять кнопок с подсказками, доступных с клавиатуры.
 */
export function RatingInput({
  value,
  onChange,
  disabled,
  labels,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  /** Подписи «Ужасно»…«Отлично» — по одной на звезду. */
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((position) => (
        <button
          key={position}
          type="button"
          disabled={disabled}
          onClick={() => onChange(position)}
          title={labels[position - 1]}
          aria-label={labels[position - 1]}
          aria-pressed={value === position}
          className="rounded-md p-1 transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50"
        >
          <Star
            className={cn(
              "size-7 transition-colors",
              position <= value
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}
