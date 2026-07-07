"use client";

import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  delta?: number;
  hint?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="mt-3 font-heading text-2xl font-bold tabular">{value}</div>
      <div className="mt-1.5 flex items-center gap-1.5 text-xs">
        {delta != null && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium tabular",
              positive ? "text-success" : "text-destructive",
            )}
          >
            {positive ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}
