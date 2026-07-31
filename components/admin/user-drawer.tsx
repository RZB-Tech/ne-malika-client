"use client";

import Link from "next/link";
import { RotateCcw, ShieldCheck, ShieldOff, Store, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import {
  DetailDrawer,
  DetailNote,
  DetailRow,
  DetailSection,
  drawerAction,
} from "@/components/admin/detail-drawer";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate, formatPrice } from "@/lib/format";
import { useAdminUsersControllerGetOne } from "@/lib/api/generated/endpoints/users-admin/users-admin";
import { devUserActivity, IS_DEV } from "@/lib/api/dev-fixtures";
import type { AdminUserDetail, AdminUserRow } from "@/lib/api/types";

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function UserDrawer({
  user,
  onOpenChange,
  onBlock,
  onUnblock,
  onSetRole,
}: {
  user: AdminUserRow | null;
  onOpenChange: (open: boolean) => void;
  onBlock: (id: number, reason: string) => Promise<void>;
  onUnblock: (id: number) => Promise<void>;
  onSetRole: (id: number, role: "admin" | "seller") => Promise<void>;
}) {
  const { t, locale } = useT();

  // Подробности подгружаем только когда карточка открыта.
  const { data, isLoading } = useAdminUsersControllerGetOne(user?.id ?? 0, {
    query: {
      enabled: user !== null,
      select: (raw) => raw as unknown as AdminUserDetail,
      retry: false,
    },
  });

  const activity = data?.recentProducts ?? (IS_DEV ? devUserActivity : []);

  return (
    <DetailDrawer
      open={user !== null}
      onOpenChange={onOpenChange}
      title={user?.fullname ?? ""}
      badges={
        user && (
          <>
            <Badge
              variant="outline"
              className={
                user.role === "admin"
                  ? "border-transparent bg-primary/12 font-medium text-primary"
                  : "border-transparent bg-muted font-medium text-muted-foreground"
              }
            >
              {user.role === "admin" ? "Администратор" : "Продавец"}
            </Badge>
            {user.blockedAt && (
              <Badge
                variant="outline"
                className="border-transparent bg-destructive/12 font-medium text-destructive"
              >
                заблокирован
              </Badge>
            )}
          </>
        )
      }
      description={user && `В системе с ${formatDate(user.createdAt, locale)}`}
      footer={
        user && (
          <>
            {user.role === "admin" ? (
              <Button
                variant="ghost"
                className={drawerAction.warning}
                onClick={() => void onSetRole(user.id, "seller")}
              >
                <ShieldOff className="size-4" /> Снять админа
              </Button>
            ) : (
              <Button
                variant="ghost"
                className={drawerAction.primary}
                onClick={() => void onSetRole(user.id, "admin")}
              >
                <ShieldCheck className="size-4" /> Сделать админом
              </Button>
            )}

            {user.shopId ? (
              <Button asChild variant="ghost" className={drawerAction.neutral}>
                <Link href={`/store/${user.shopId}`}>
                  <Store className="size-4" /> Магазин
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" className={drawerAction.neutral} disabled>
                <Store className="size-4" /> Нет магазина
              </Button>
            )}

            {user.blockedAt ? (
              <Button
                variant="ghost"
                className={`col-span-2 ${drawerAction.success}`}
                onClick={() => void onUnblock(user.id)}
              >
                <RotateCcw className="size-4" /> Разблокировать
              </Button>
            ) : (
              <AbolishDialog
                title="Заблокировать пользователя"
                description="Вход в кабинет будет закрыт. Причина видна при входе."
                onConfirm={(reason) => onBlock(user.id, reason)}
              >
                <Button
                  variant="ghost"
                  className={`col-span-2 ${drawerAction.danger}`}
                >
                  <UserX className="size-4" /> Заблокировать
                </Button>
              </AbolishDialog>
            )}
          </>
        )
      }
    >
      {user && (
        <>
          <div className="flex items-center gap-3">
            <Avatar className="size-12">
              <AvatarImage src={user.telegramPhoto ?? undefined} />
              <AvatarFallback>{initials(user.fullname)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="truncate text-sm text-muted-foreground">
                {user.telegramUsername
                  ? `@${user.telegramUsername}`
                  : "без username"}
              </div>
              <div className="tabular truncate text-sm">
                {user.phoneNumber ?? "номер не подтверждён"}
              </div>
            </div>
          </div>

          <DetailSection title="Магазин">
            {user.shopName ? (
              <>
                <DetailRow
                  label="Название"
                  value={
                    <span className="inline-flex items-center gap-2">
                      {user.shopName}
                      {user.shopStatus && (
                        <EntityStatusBadge status={user.shopStatus} />
                      )}
                    </span>
                  }
                />
                <DetailRow label="Товаров" value={user.productCount} />
                <DetailRow
                  label="Последнее изменение"
                  value={
                    user.lastProductAt
                      ? formatDate(user.lastProductAt, locale)
                      : "—"
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Магазин не создан.
              </p>
            )}
          </DetailSection>

          {user.blockedAt && (
            <DetailNote
              tone="danger"
              title={`Заблокирован ${formatDate(user.blockedAt, locale)}`}
            >
              {user.blockReason ?? "Причина не указана"}
            </DetailNote>
          )}

          <DetailSection title="Последние действия">
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Товаров пока не добавлял.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {activity.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm">{p.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(p.updatedAt, locale)} ·{" "}
                        {formatPrice(Number(p.price), locale)}{" "}
                        {t("common.currency")}
                      </div>
                    </div>
                    <EntityStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </>
      )}
    </DetailDrawer>
  );
}
