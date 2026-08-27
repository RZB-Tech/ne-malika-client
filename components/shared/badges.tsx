"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";
import type { Availability, ModerationStatus } from "@/lib/data";
import type { BannerModerationStatus, UserRole } from "@/lib/api/types";
import { CheckCircle2, Clock, Package, XCircle } from "@/components/icons";

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
  const { cls, Icon } = cfg[status] ?? cfg.moderation;
  return (
    <Badge variant="outline" className={cn("gap-1 border-transparent font-medium", cls, className)}>
      <Icon className="size-3" />
      {t(`moderation.${status in cfg ? status : "moderation"}`)}
    </Badge>
  );
}

/**
 * Статус модерации баннера продавца.
 *
 * Отдельный компонент, а не расширение `ModerationBadge` выше. Тот типизирован
 * `draft | moderation | published | rejected` (`lib/data.ts`) и заканчивается
 * фолбэком `cfg[status] ?? cfg.moderation`: `pending` и `approved` в его
 * словаре отсутствуют оба, и оба отрисовались бы одинаково — жёлтым «На
 * модерации». Одобренный баннер выглядел бы неодобренным, и продавец пошёл бы
 * спрашивать, почему его не пускают.
 *
 * Подписи берём из `admin.shopBanners.status.*` — единственной тройки под эти
 * три слова. Соседние `admin.status.*` (`active/hidden/abolished/pending`) и
 * `moderation.*` (про товар) описывают другие состояния, а завести вторую
 * тройку в `seller.*` значило бы дать продавцу и модератору расходящиеся
 * названия одного и того же.
 */
export function BannerStatusBadge({
  status,
  className,
}: {
  status: BannerModerationStatus;
  className?: string;
}) {
  const { t } = useT();
  const cfg: Record<
    BannerModerationStatus,
    { cls: string; Icon: typeof Clock }
  > = {
    pending: { cls: "bg-warning/15 text-warning", Icon: Clock },
    approved: { cls: "bg-success/12 text-success", Icon: CheckCircle2 },
    rejected: { cls: "bg-destructive/12 text-destructive", Icon: XCircle },
  };
  const known = status in cfg ? status : "pending";
  const { cls, Icon } = cfg[known];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-transparent font-medium", cls, className)}
    >
      <Icon className="size-3" />
      {t(`admin.shopBanners.status.${known}`)}
    </Badge>
  );
}

/** Роль пользователя: в админке и в профиле покупателя. */
export function RoleBadge({
  role,
  className,
}: {
  role: UserRole;
  className?: string;
}) {
  const { t } = useT();
  const cfg: Record<UserRole, string> = {
    user: "bg-muted text-muted-foreground",
    seller: "bg-success/12 text-success",
    admin: "bg-primary/12 text-primary",
  };
  const cls = cfg[role] ?? cfg.user;
  const label = t(`roles.${role in cfg ? role : "user"}`);

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", cls, className)}
    >
      {label}
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
