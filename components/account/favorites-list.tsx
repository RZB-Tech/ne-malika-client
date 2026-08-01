"use client";

import Link from "next/link";
import { Cloud, Heart, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ProductCard } from "@/components/product/product-card";
import { useT } from "@/components/providers/i18n-provider";
import { mapPublicProductCard } from "@/lib/api/mappers";
import { formatDate } from "@/lib/format";
import { snapshotToPublicCard } from "@/lib/product-snapshot";
import { useFavorites } from "@/lib/favorites/use-favorites";

export function FavoritesList() {
  const { t, locale } = useT();
  const { items, isLoading, isRemote, remove, clear } = useFavorites();

  if (isLoading && items.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <Heart className="size-10 text-muted-foreground/60" />
        <h2 className="mt-4 font-heading text-lg font-semibold">
          {t("favorites.empty")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {t("favorites.emptyText")}
        </p>
        <Button asChild className="mt-6">
          <Link href="/">{t("account.history.toCatalog")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl bg-primary/5 px-4 py-3 text-sm">
        <Cloud className="mt-0.5 size-4 shrink-0 text-primary" />
        <div>
          <p className="font-medium">
            {isRemote
              ? t("favorites.syncedTitle")
              : t("favorites.localTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {isRemote ? t("favorites.syncedText") : t("favorites.localText")}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {t("favorites.count", { count: items.length })}
        </span>
        <ConfirmDialog
          title={t("favorites.clearTitle")}
          description={t("favorites.clearText")}
          confirmLabel={t("favorites.clear")}
          destructive
          onConfirm={clear}
        >
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Trash2 className="size-4" />
            {t("favorites.clear")}
          </Button>
        </ConfirmDialog>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id}>
            <ProductCard
              product={mapPublicProductCard(
                snapshotToPublicCard(item, item.addedAt),
              )}
            />
            <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
              <span className="truncate text-xs text-muted-foreground">
                {t("favorites.addedAt", {
                  date: formatDate(item.addedAt, locale),
                })}
              </span>
              <button
                type="button"
                onClick={() => void remove(item.id)}
                title={t("favorites.remove")}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" />
                {t("common.delete")}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
