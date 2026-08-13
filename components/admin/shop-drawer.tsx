"use client";

import Link from "next/link";
import {
  Ban,
  ExternalLink,
  Lock,
  RotateCcw,
  Trash2,
  UserX,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import {
  DetailDrawer,
  DetailNote,
  DetailRow,
  DetailSection,
  drawerAction,
} from "@/components/admin/detail-drawer";
import { useT } from "@/components/providers/i18n-provider";
import { ShopCreditsRow } from "@/components/admin/shop-credits-row";
import { formatDate } from "@/lib/format";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import type { AdminShopRow } from "@/lib/api/types";

export function ShopDrawer({
  shop,
  onOpenChange,
  onAbolish,
  onRestore,
  onBlockOwner,
  onUnblockOwner,
  onSetRestricted,
  onRemove,
}: {
  shop: AdminShopRow | null;
  onOpenChange: (open: boolean) => void;
  onAbolish: (id: number, reason: string) => Promise<void>;
  onRestore: (id: number) => Promise<void>;
  onBlockOwner: (ownerId: number, reason: string) => Promise<void>;
  onUnblockOwner: (ownerId: number) => Promise<void>;
  /** Доступ к закрытым разделам каталога — смартфонам и планшетам. */
  onSetRestricted: (id: number, enabled: boolean) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const { t, locale } = useT();

  return (
    <DetailDrawer
      open={shop !== null}
      onOpenChange={onOpenChange}
      title={shop?.name ?? ""}
      badges={
        shop && (
          <>
            <EntityStatusBadge status={shop.status} />
            {shop.ownerBlockedAt && (
              <Badge
                variant="outline"
                className="border-transparent bg-destructive/12 font-medium text-destructive"
              >
                {t("admin.shops.ownerBlockedLabel")}
              </Badge>
            )}
          </>
        )
      }
      description={
        shop &&
        t("admin.shops.createdSummary", {
          date: formatDate(shop.createdAt, locale),
          count: shop.productCount,
        })
      }
      footer={
        shop && (
          <>
            <Button asChild variant="ghost" className={drawerAction.neutral}>
              <Link href={`/store/${shop.id}`}>
                <ExternalLink className="size-4" /> {t("admin.shops.profile")}
              </Link>
            </Button>

            {shop.status === "active" ? (
              <AbolishDialog
                title={t("admin.shops.abolish")}
                description={t("admin.shops.abolishText")}
                onConfirm={(reason) => onAbolish(shop.id, reason)}
              >
                <Button variant="ghost" className={drawerAction.warning}>
                  <Ban className="size-4" /> {t("admin.common.abolish")}
                </Button>
              </AbolishDialog>
            ) : (
              <Button
                variant="ghost"
                className={drawerAction.success}
                onClick={() => onRestore(shop.id)}
              >
                <RotateCcw className="size-4" /> {t("admin.common.restore")}
              </Button>
            )}

            {shop.ownerBlockedAt ? (
              <Button
                variant="ghost"
                className={`col-span-2 ${drawerAction.success}`}
                onClick={() => onUnblockOwner(shop.ownerId)}
              >
                <RotateCcw className="size-4" /> {t("admin.shops.unblockOwnerShort")}
              </Button>
            ) : (
              <AbolishDialog
                title={t("admin.shops.blockOwner")}
                description={t("admin.shops.blockOwnerText")}
                onConfirm={(reason) => onBlockOwner(shop.ownerId, reason)}
              >
                <Button
                  variant="ghost"
                  className={`col-span-2 ${drawerAction.danger}`}
                >
                  <UserX className="size-4" /> {t("admin.shops.blockOwnerShort")}
                </Button>
              </AbolishDialog>
            )}

            <Button
              variant="ghost"
              className={`col-span-2 ${
                shop.restrictedCategoriesEnabled
                  ? drawerAction.warning
                  : drawerAction.primary
              }`}
              onClick={() =>
                void onSetRestricted(
                  shop.id,
                  !shop.restrictedCategoriesEnabled,
                )
              }
            >
              <Lock className="size-4" />{" "}
              {t(
                shop.restrictedCategoriesEnabled
                  ? "admin.shops.restrictedRevoke"
                  : "admin.shops.restrictedGrant",
              )}
            </Button>

            <ConfirmDialog
              title={t("admin.shops.removeTitle")}
              description={t("admin.shops.removeText", {
                name: shop.name,
                count: shop.productCount,
              })}
              confirmLabel={t("admin.productList.remove")}
              destructive
              onConfirm={() => onRemove(shop.id)}
            >
              <Button
                variant="ghost"
                className={`col-span-2 ${drawerAction.danger}`}
              >
                <Trash2 className="size-4" /> {t("admin.shops.remove")}
              </Button>
            </ConfirmDialog>
          </>
        )
      }
    >
      {shop && (
        <>
          <div className="flex items-center gap-3">
            <StoreAvatar
              name={shop.name}
              hue={hueFromId(shop.id)}
              src={photoUrl(shop.photo)}
              className="size-12 shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <div className="truncate font-medium">{shop.ownerName}</div>
              <div className="truncate text-sm text-muted-foreground">
                {shop.ownerUsername ? `@${shop.ownerUsername}` : t("common.noUsername")}
              </div>
            </div>
          </div>

          <DetailSection title={t("admin.credits.balance")}>
            <ShopCreditsRow shopId={shop.id} />
          </DetailSection>

          <DetailSection title={t("admin.shops.contacts")}>
            <DetailRow label={t("admin.shops.phone")} value={shop.contact} />
            <DetailRow
              label={t("admin.shops.address")}
              value={shop.address ?? "—"}
            />
            <DetailRow
              label={t("admin.common.productCount")}
              value={shop.productCount}
            />
            <DetailRow
              label={t("admin.shops.restrictedTitle")}
              value={t(
                shop.restrictedCategoriesEnabled
                  ? "admin.shops.restrictedOn"
                  : "admin.shops.restrictedOff",
              )}
            />
          </DetailSection>

          {shop.status === "abolished" && shop.abolishReason && (
            <DetailNote tone="danger" title={t("admin.shops.abolishedNote")}>
              {shop.abolishReason}
            </DetailNote>
          )}

          {shop.ownerBlockedAt && (
            <DetailNote
              tone="danger"
              title={t("admin.shops.ownerBlockedAt", {
                date: formatDate(shop.ownerBlockedAt, locale),
              })}
            >
              {t("admin.shops.ownerBlockedText", {
                reason: shop.ownerBlockReason ?? t("common.reasonMissing"),
              })}
            </DetailNote>
          )}
        </>
      )}
    </DetailDrawer>
  );
}
