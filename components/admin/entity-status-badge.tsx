import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { EntityStatus } from "@/lib/api/types";

const STYLE: Record<EntityStatus, string> = {
  active: "bg-success/12 text-success",
  hidden: "bg-warning/15 text-warning",
  abolished: "bg-destructive/12 text-destructive",
};

const LABEL: Record<EntityStatus, string> = {
  active: "Активен",
  hidden: "Скрыт",
  abolished: "Упразднён",
};

/** Единый бейдж статуса для админки: и у магазинов, и у товаров он один и тот же. */
export function EntityStatusBadge({
  status,
  className,
}: {
  status: EntityStatus;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", STYLE[status], className)}
    >
      {LABEL[status]}
    </Badge>
  );
}
