"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function BarList({
  data,
  formatValue,
}: {
  data: { label: string; value: number; hue?: number; color?: string }[];
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{d.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / max) * 100}%`,
                background: d.color ?? (d.hue != null ? `oklch(0.6 0.16 ${d.hue})` : "var(--primary)"),
              }}
            />
          </div>
          <span className="text-right font-medium tabular text-foreground">
            {formatValue ? formatValue(d.value) : d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export interface TrendPoint {
  date: string;
  value: number;
}

export function TrendPanel({
  label,
  total,
  points,
  formatValue,
  formatDate,
}: {
  label: string;
  total: string;
  points: TrendPoint[];
  formatValue: (v: number) => string;
  formatDate: (iso: string) => string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const W = 300;
  const H = 72;

  const max = Math.max(...points.map((p) => p.value), 1);
  const stepX = points.length > 1 ? W / (points.length - 1) : 0;
  const at = (i: number, v: number) => [i * stepX, H - (v / max) * H] as const;

  const line = points
    .map((p, i) => {
      const [x, y] = at(i, p.value);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const area = points.length
    ? `M0,${H} ${line.slice(1)} L${((points.length - 1) * stepX).toFixed(2)},${H} Z`
    : "";

  const point = active === null ? null : points[active];

  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="tabular mt-0.5 text-2xl font-semibold">{total}</div>

      <div
        className="relative mt-3"
        onPointerLeave={() => setActive(null)}
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          if (box.width === 0 || points.length === 0) return;
          const ratio = (e.clientX - box.left) / box.width;
          const i = Math.round(ratio * (points.length - 1));
          setActive(Math.min(points.length - 1, Math.max(0, i)));
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          className="h-16 w-full"
          role="img"
          aria-label={`${label}: ${total}`}
        >
          {}
          <path d={area} fill="var(--primary)" opacity={0.1} />
          <path
            d={line}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {active !== null && (
            <line
              x1={active * stepX}
              y1={0}
              x2={active * stepX}
              y2={H}
              stroke="var(--border)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )}
          <line
            x1={0}
            y1={H}
            x2={W}
            y2={H}
            stroke="var(--border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {}
        {point && (
          <span
            className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
            style={{
              left: `${(active! / Math.max(1, points.length - 1)) * 100}%`,
              top: `${(at(active!, point.value)[1] / H) * 100}%`,
            }}
          />
        )}

        {point && (
          <div
            className="pointer-events-none absolute -top-1 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1 text-xs shadow-sm"
            style={{
              left: `${Math.min(85, Math.max(15, (active! / Math.max(1, points.length - 1)) * 100))}%`,
            }}
          >
            <span className="text-muted-foreground">{formatDate(point.date)}</span>{" "}
            <span className="font-medium">{formatValue(point.value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export interface StackSeries {
  key: string;
  label: string;
  color: string;
}

export interface StackPoint {
  date: string;
  values: Record<string, number>;
}

/**
 * Столбцы с накоплением: сколько всего за сутки и из чего сложилось.
 *
 * Сегменты разделяет двухпиксельный просвет подложки, а не обводка — рамка
 * добавила бы чернил, которые не несут данных. Значения по одному над каждым
 * столбцом не подписываем: их несёт подсказка при наведении и таблица под
 * графиком.
 */
export function StackedColumns({
  points,
  series,
  formatValue,
  formatDate,
  emptyLabel,
}: {
  points: StackPoint[];
  series: StackSeries[];
  formatValue: (v: number) => string;
  formatDate: (iso: string) => string;
  emptyLabel: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const totals = points.map((p) =>
    series.reduce((acc, s) => acc + (p.values[s.key] ?? 0), 0),
  );
  const max = Math.max(...totals, 0);

  if (max === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const point = active === null ? null : points[active];

  // На годовом периоде столбцов под четыре сотни: просвет между ними съел бы
  // половину ширины, поэтому на плотных периодах столбцы стоят вплотную.
  const dense = points.length > 120;

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-sm"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative mt-3" onPointerLeave={() => setActive(null)}>
        <div
          className={cn("flex h-40 items-end", !dense && "gap-px")}
          role="img"
          aria-label={`${series.map((s) => s.label).join(", ")}: ${formatValue(
            totals.reduce((a, b) => a + b, 0),
          )}`}
        >
          {points.map((p, i) => {
            const total = totals[i];
            return (
              <div
                key={p.date}
                className="flex h-full flex-1 items-end justify-center"
                onPointerEnter={() => setActive(i)}
              >
                <div
                  className={cn(
                    "flex w-full max-w-6 flex-col-reverse gap-[2px] overflow-hidden transition-opacity",
                    dense ? "rounded-t-[1px]" : "rounded-t-[4px]",
                    active !== null && active !== i && "opacity-55",
                  )}
                  style={{ height: total === 0 ? "1px" : `${(total / max) * 100}%` }}
                >
                  {total === 0 ? (
                    <div className="h-px w-full bg-border" />
                  ) : (
                    series
                      .filter((s) => (p.values[s.key] ?? 0) > 0)
                      .map((s) => (
                        <div
                          key={s.key}
                          // Доли задаём через flex-grow, а не процентами высоты:
                          // проценты считаются от всей высоты столбца, и вместе
                          // с просветами сумма вылезала бы за него — верхний
                          // сегмент обрезался бы на пару пикселей.
                          style={{
                            flexGrow: p.values[s.key] ?? 0,
                            flexBasis: 0,
                            minHeight: 0,
                            background: s.color,
                          }}
                        />
                      ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="h-px w-full bg-border" />

        {point && (
          <div
            className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border bg-popover px-2 py-1.5 text-xs shadow-sm"
            style={{
              left: `${Math.min(88, Math.max(12, ((active! + 0.5) / points.length) * 100))}%`,
            }}
          >
            <div className="text-muted-foreground">{formatDate(point.date)}</div>
            {series
              .filter((s) => (point.values[s.key] ?? 0) > 0)
              .map((s) => (
                <div key={s.key} className="mt-0.5 flex items-center gap-1.5">
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-sm"
                    style={{ background: s.color }}
                  />
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="ml-auto font-medium">
                    {formatValue(point.values[s.key] ?? 0)}
                  </span>
                </div>
              ))}
            <div className="mt-1 border-t pt-1 text-right font-medium">
              {formatValue(totals[active!])}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
