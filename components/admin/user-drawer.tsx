"use client";

import Link from "next/link";
import { RotateCcw, ShieldCheck, ShieldOff, Store, UserX } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import { RoleBadge } from "@/components/shared/badges";
import {
  DetailDrawer,
  DetailNote,
  DetailRow,
  DetailSection,
  drawerAction,
} from "@/components/admin/detail-drawer";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate, priceText } from "@/lib/format";
import { useAdminUsersControllerGetOne } from "@/lib/api/generated/endpoints/users-admin/users-admin";
import { devUserActivity, IS_DEV } from "@/lib/api/dev-fixtures";
import type { AdminUserDetail, AdminUserRow, UserRole } from "@/lib/api/types";

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
  onSetRole: (id: number, role: UserRole) => Promise<void>;
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
            <RoleBadge role={user.role} />
            {user.blockedAt && (
              <Badge
                variant="outline"
                className="border-transparent bg-destructive/12 font-medium text-destructive"
              >
                {t("admin.common.blocked")}
              </Badge>
            )}
          </>
        )
      }
      description={
        user && t("admin.users.since", { date: formatDate(user.createdAt, locale) })
      }
      footer={
        user && (
          <>
            {user.role === "admin" ? (
              <Button
                variant="ghost"
                className={drawerAction.warning}
                onClick={() =>
                  void onSetRole(user.id, user.shopId ? "seller" : "user")
                }
              >
                <ShieldOff className="size-4" /> {t("admin.users.dropAdminShort")}
              </Button>
            ) : (
              <Button
                variant="ghost"
                className={drawerAction.primary}
                onClick={() => void onSetRole(user.id, "admin")}
              >
                <ShieldCheck className="size-4" /> {t("admin.users.makeAdminShort")}
              </Button>
            )}

            {user.shopId ? (
              <Button asChild variant="ghost" className={drawerAction.neutral}>
                <Link href={`/store/${user.shopId}`}>
                  <Store className="size-4" /> {t("admin.users.shopButton")}
                </Link>
              </Button>
            ) : (
              <Button variant="ghost" className={drawerAction.neutral} disabled>
                <Store className="size-4" /> {t("admin.users.noShopButton")}
              </Button>
            )}

            {user.blockedAt ? (
              <Button
                variant="ghost"
                className={`col-span-2 ${drawerAction.success}`}
                onClick={() => void onUnblock(user.id)}
              >
                <RotateCcw className="size-4" /> {t("admin.users.unblock")}
              </Button>
            ) : (
              <AbolishDialog
                title={t("admin.users.blockTitle")}
                description={t("admin.users.blockText")}
                onConfirm={(reason) => onBlock(user.id, reason)}
              >
                <Button
                  variant="ghost"
                  className={`col-span-2 ${drawerAction.danger}`}
                >
                  <UserX className="size-4" /> {t("admin.users.block")}
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
                  : t("common.noUsername")}
              </div>
              <div className="tabular truncate text-sm">
                {user.phoneNumber ?? t("admin.users.phoneMissing")}
              </div>
            </div>
          </div>

          <DetailSection title={t("admin.users.shopSection")}>
            {user.shopName ? (
              <>
                <DetailRow
                  label={t("admin.users.shopName")}
                  value={
                    <span className="inline-flex items-center gap-2">
                      {user.shopName}
                      {user.shopStatus && (
                        <EntityStatusBadge status={user.shopStatus} />
                      )}
                    </span>
                  }
                />
                <DetailRow
                  label={t("admin.common.productCount")}
                  value={user.productCount}
                />
                <DetailRow
                  label={t("admin.users.lastChange")}
                  value={
                    user.lastProductAt
                      ? formatDate(user.lastProductAt, locale)
                      : "—"
                  }
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("admin.users.noShop")}
              </p>
            )}
          </DetailSection>

          {user.blockedAt && (
            <DetailNote
              tone="danger"
              title={t("admin.users.blockedAt", {
                date: formatDate(user.blockedAt, locale),
              })}
            >
              {user.blockReason ?? t("common.reasonMissing")}
            </DetailNote>
          )}

          <DetailSection title={t("admin.users.recent")}>
            {isLoading ? (
              <Skeleton className="h-20 w-full" />
            ) : activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("admin.users.noProducts")}
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
                        {priceText(p.price, locale, t)}
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
