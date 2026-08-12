import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPanel({
  icon,
  title,
  description,
  action,
  compact = false,
  tone = "neutral",
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
  tone?: "neutral" | "error";
  className?: string;
}) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card px-6 text-center",
        tone === "error" ? "border-destructive/30" : "border-border",
        compact ? "min-h-48 py-10" : "min-h-80 py-16",
        className,
      )}
    >
      {icon ? (
        <div
          className={cn(
            "grid size-11 place-items-center rounded-xl",
            tone === "error"
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground",
          )}
        >
          {icon}
        </div>
      ) : null}
      <h2 className="mt-4 font-heading text-lg font-semibold">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-sm text-sm leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
