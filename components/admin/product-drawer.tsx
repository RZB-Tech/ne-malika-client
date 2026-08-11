"use client";

import Link from "next/link";
import { Ban, ExternalLink, Pencil, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/product-image";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import {
  DetailDrawer,
  DetailNote,
  DetailRow,
  DetailSection,
  drawerAction,
} from "@/components/admin/detail-drawer";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Markdown } from "@/components/shared/markdown";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate, priceText } from "@/lib/format";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import type { AdminProductRow } from "@/lib/api/types";

export function ProductDrawer({
  product,
  onOpenChange,
  onAbolish,
  onRestore,
  onRemove,
  onEdit,
}: {
  product: AdminProductRow | null;
  onOpenChange: (open: boolean) => void;
  onAbolish: (id: number, reason: string) => Promise<void>;
  onRestore: (id: number) => Promise<void>;
  onRemove: (id: number, name: string) => Promise<void>;
  onEdit: (product: AdminProductRow) => void;
}) {
  const { t, locale } = useT();

  return (
    <DetailDrawer
      open={product !== null}
      onOpenChange={onOpenChange}
      title={product?.name ?? ""}
      badges={product && <EntityStatusBadge status={product.status} />}
      description={
        product &&
        `${product.shopName} · ${formatDate(product.createdAt, locale)} · ${t(
          product.state === "new" ? "product.stateNew" : "product.stateOld",
        ).toLowerCase()}`
      }
      footer={
        product && (
          <>
            <Button
              variant="ghost"
              className={drawerAction.primary}
              onClick={() => onEdit(product)}
            >
              <Pencil className="size-4" /> {t("admin.productList.edit")}
            </Button>

            <Button asChild variant="ghost" className={drawerAction.neutral}>
              <Link href={`/product/${product.id}`}>
                <ExternalLink className="size-4" /> {t("admin.productList.onSite")}
              </Link>
            </Button>

            {product.status === "active" ? (
              <AbolishDialog
                title={t("admin.productList.abolishTitle")}
                description={t("admin.productList.abolishText")}
                onConfirm={(reason) => onAbolish(product.id, reason)}
              >
                <Button variant="ghost" className={drawerAction.warning}>
                  <Ban className="size-4" /> {t("admin.productList.abolish")}
                </Button>
              </AbolishDialog>
            ) : (
              <Button
                variant="ghost"
                className={drawerAction.success}
                onClick={() => onRestore(product.id)}
              >
                <RotateCcw className="size-4" /> {t("admin.common.restore")}
              </Button>
            )}

            <ConfirmDialog
              title={t("admin.productList.removeTitle")}
              description={t("admin.productList.removeText", {
                name: product.name,
              })}
              confirmLabel={t("admin.productList.remove")}
              destructive
              onConfirm={() => onRemove(product.id, product.name)}
            >
              <Button variant="ghost" className={drawerAction.danger}>
                <Trash2 className="size-4" /> {t("admin.productList.remove")}
              </Button>
            </ConfirmDialog>
          </>
        )
      }
    >
      {product && (
        <>
          <div className="flex items-center gap-4">
            <ProductImage
              hue={hueFromId(product.id)}
              categorySlug=""
              src={photoUrl(product.photos?.[0])}
              alt={product.name}
              className="size-20 shrink-0 rounded-xl"
              iconClassName="size-6"
            />
            <div className="tabular text-xl font-bold">
              {priceText(product.price, locale, t)}
            </div>
          </div>

          {product.description && (
            <DetailSection title={t("product.description")}>
              {/* Тем же разбором, что и витрина: администратор должен видеть
                  карточку такой, какой её увидит покупатель. */}
              <Markdown
                text={product.description}
                className="text-sm text-muted-foreground"
              />
            </DetailSection>
          )}

          {product.characteristics && product.characteristics.length > 0 && (
            <DetailSection title={t("product.specs")}>
              {product.characteristics.map((c) => (
                <DetailRow key={c.key} label={c.key} value={c.value} />
              ))}
            </DetailSection>
          )}

          {product.status === "abolished" && product.abolishReason && (
            <DetailNote
              tone="danger"
              title={
                product.abolishedAt
                  ? t("admin.productList.abolishedAt", {
                      date: formatDate(product.abolishedAt, locale),
                    })
                  : t("admin.status.abolished")
              }
            >
              {product.abolishReason}
            </DetailNote>
          )}

          {product.status === "hidden" && (
            <DetailNote
              tone="warning"
              title={t("admin.productList.hiddenByAi")}
            >
              {t("admin.productList.hiddenByAiText")}
            </DetailNote>
          )}

          {product.shopStatus !== "active" && (
            <DetailNote>
              {t("admin.productList.shopInactive", { name: product.shopName })}
            </DetailNote>
          )}
        </>
      )}
    </DetailDrawer>
  );
}
