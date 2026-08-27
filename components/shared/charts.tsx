"use client";

import { useState } from "react";

export function BarList({
  data,
  formatValue,
}: {
  data: { label: string; value: number; hue?: number }[];
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
                background: d.hue != null ? `oklch(0.6 0.16 ${d.hue})` : "var(--primary)",
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
            <span className="text-muted-foreground">
              {formatDate(point.date)}
            </span>{" "}
            <span className="font-medium">{formatValue(point.value)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
