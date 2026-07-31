"use client";

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
