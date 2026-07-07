"use client";

import { useId } from "react";

/** Smooth area/line chart drawn as inline SVG. Scales to container width. */
export function AreaChart({
  data,
  height = 180,
  className,
}: {
  data: number[];
  height?: number;
  className?: string;
}) {
  const id = useId();
  const w = 600;
  const h = height;
  const pad = 8;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return [x, y] as const;
  });

  const line = pts
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ");
  const area = `${line} L${pts[pts.length - 1][0]},${h - pad} L${pts[0][0]},${h - pad} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Horizontal labelled bars. */
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

/** Vertical bars with an x-axis, for time series. */
export function ColumnChart({
  data,
  height = 180,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
          <div
            className="w-full rounded-t-sm bg-primary/80 transition-colors group-hover:bg-primary"
            style={{ height: `${Math.max((d.value / max) * (height - 24), 2)}px` }}
            title={String(d.value)}
          />
          <span className="text-[10px] text-muted-foreground tabular">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
