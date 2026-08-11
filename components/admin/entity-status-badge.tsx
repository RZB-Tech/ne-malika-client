"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { EntityStatus } from "@/lib/api/types";

const STYLE: Record<EntityStatus, string> = {
  active: "bg-success/12 text-success",
  hidden: "bg-warning/15 text-warning",
  abolished: "bg-destructive/12 text-destructive",
  pending: "bg-muted text-muted-foreground",
};

/** Единый бейдж статуса для админки: и у магазинов, и у товаров он один и тот же. */
export function EntityStatusBadge({
  status,
  className,
}: {
  status: EntityStatus;
  className?: string;
}) {
  const { t } = useT();
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", STYLE[status], className)}
    >
      {t(`admin.status.${status}`)}
    </Badge>
  );
}
