"use client";

import Link from "next/link";
import { Ban, ExternalLink, RotateCcw, Trash2, UserX } from "lucide-react";
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
  onRemove,
}: {
  shop: AdminShopRow | null;
  onOpenChange: (open: boolean) => void;
  onAbolish: (id: number, reason: string) => Promise<void>;
  onRestore: (id: number) => Promise<void>;
  onBlockOwner: (ownerId: number, reason: string) => Promise<void>;
  onUnblockOwner: (ownerId: number) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
}) {
  const { locale } = useT();

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
                владелец заблокирован
              </Badge>
            )}
          </>
        )
      }
      description={
        shop &&
        `${formatDate(shop.createdAt, locale)} · ${shop.productCount} товаров`
      }
      footer={
        shop && (
          <>
            <Button asChild variant="ghost" className={drawerAction.neutral}>
              <Link href={`/store/${shop.id}`}>
                <ExternalLink className="size-4" /> Профиль
              </Link>
            </Button>

            {shop.status === "active" ? (
              <AbolishDialog
                title="Упразднить магазин"
                description="Магазин и его товары исчезнут из выдачи. Причина видна продавцу."
                onConfirm={(reason) => onAbolish(shop.id, reason)}
              >
                <Button variant="ghost" className={drawerAction.warning}>
                  <Ban className="size-4" /> Упразднить
                </Button>
              </AbolishDialog>
            ) : (
              <Button
                variant="ghost"
                className={drawerAction.success}
                onClick={() => onRestore(shop.id)}
              >
                <RotateCcw className="size-4" /> Вернуть
              </Button>
            )}

            {shop.ownerBlockedAt ? (
              <Button
                variant="ghost"
                className={`col-span-2 ${drawerAction.success}`}
                onClick={() => onUnblockOwner(shop.ownerId)}
              >
                <RotateCcw className="size-4" /> Разблокировать владельца
              </Button>
            ) : (
              <AbolishDialog
                title="Заблокировать продавца"
                description="Владелец не сможет войти в кабинет и создать новый магазин."
                onConfirm={(reason) => onBlockOwner(shop.ownerId, reason)}
              >
                <Button
                  variant="ghost"
                  className={`col-span-2 ${drawerAction.danger}`}
                >
                  <UserX className="size-4" /> Заблокировать владельца
                </Button>
              </AbolishDialog>
            )}

            <ConfirmDialog
              title="Удалить магазин?"
              description={`«${shop.name}» и все его товары (${shop.productCount}) исчезнут навсегда, владелец снова станет покупателем. Если нужна обратимая блокировка — используйте «Упразднить».`}
              confirmLabel="Удалить"
              destructive
              onConfirm={() => onRemove(shop.id)}
            >
              <Button
                variant="ghost"
                className={`col-span-2 ${drawerAction.danger}`}
              >
                <Trash2 className="size-4" /> Удалить магазин
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
                {shop.ownerUsername ? `@${shop.ownerUsername}` : "без username"}
              </div>
            </div>
          </div>

          <DetailSection title="Контакты">
            <DetailRow label="Телефон" value={shop.contact} />
            <DetailRow label="Адрес" value={shop.address ?? "—"} />
            <DetailRow label="Товаров" value={shop.productCount} />
          </DetailSection>

          {shop.status === "abolished" && shop.abolishReason && (
            <DetailNote tone="danger" title="Магазин упразднён">
              {shop.abolishReason}
            </DetailNote>
          )}

          {shop.ownerBlockedAt && (
            <DetailNote
              tone="danger"
              title={`Владелец заблокирован ${formatDate(shop.ownerBlockedAt, locale)}`}
            >
              {shop.ownerBlockReason ?? "Причина не указана"}. Вход в кабинет
              закрыт.
            </DetailNote>
          )}
        </>
      )}
    </DetailDrawer>
  );
}
