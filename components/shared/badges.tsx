"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";
import type { Availability, ModerationStatus } from "@/lib/data";
import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";

export function AvailabilityBadge({
  status,
  className,
}: {
  status: Availability;
  className?: string;
}) {
  const { t } = useT();
  const styles: Record<Availability, string> = {
    in_stock:
      "border-transparent bg-success/12 text-success dark:bg-success/15",
    out_of_stock:
      "border-transparent bg-muted text-muted-foreground",
    on_order:
      "border-transparent bg-warning/15 text-warning dark:bg-warning/15",
  };
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium", styles[status], className)}>
      <span
        className={cn(
          "size-1.5 rounded-full",
          status === "in_stock" && "bg-success",
          status === "out_of_stock" && "bg-muted-foreground",
          status === "on_order" && "bg-warning",
        )}
      />
      {t(`availability.${status}`)}
    </Badge>
  );
}

export function ModerationBadge({
  status,
  className,
}: {
  status: ModerationStatus;
  className?: string;
}) {
  const { t } = useT();
  const cfg: Record<ModerationStatus, { cls: string; Icon: typeof Clock }> = {
    draft: { cls: "bg-muted text-muted-foreground", Icon: Package },
    moderation: { cls: "bg-warning/15 text-warning", Icon: Clock },
    published: { cls: "bg-success/12 text-success", Icon: CheckCircle2 },
    rejected: { cls: "bg-destructive/12 text-destructive", Icon: XCircle },
  };
  const { cls, Icon } = cfg[status];
  return (
    <Badge variant="outline" className={cn("gap-1 border-transparent font-medium", cls, className)}>
      <Icon className="size-3" />
      {t(`moderation.${status}`)}
    </Badge>
  );
}

export function DiscountBadge({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  return (
    <Badge
      className={cn(
        "border-transparent bg-destructive text-white font-semibold tabular",
        className,
      )}
    >
      −{percent}%
    </Badge>
  );
}
