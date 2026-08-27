"use client";

import Link from "next/link";
import { History, Trash2, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { StatusPanel } from "@/components/shared/status-panel";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { SyncNotice } from "@/components/account/sync-notice";
import { useT } from "@/components/providers/i18n-provider";
import { mapPublicProductCard } from "@/lib/api/mappers";
import { formatDate } from "@/lib/format";
import { snapshotToPublicCard } from "@/lib/product-snapshot";
import { useViewHistory, type HistoryItem } from "@/lib/history/use-view-history";

function toProduct(item: HistoryItem) {
  return mapPublicProductCard(snapshotToPublicCard(item, item.viewedAt));
}

export function ViewHistory() {
  const { t, locale } = useT();
  const { items, isLoading, isRemote, remove, clear } = useViewHistory();

  if (isLoading && items.length === 0) {
    return <ProductGridSkeleton count={4} />;
  }

  if (items.length === 0) {
    return (
      <StatusPanel
        icon={<History className="size-5" />}
        title={t("account.history.empty")}
        description={t("account.history.emptyText")}
        action={
          <Button asChild>
            <Link href="/">{t("account.history.toCatalog")}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <SyncNotice isRemote={isRemote} prefix="account.history" />

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {t("account.history.count", { count: items.length })}
        </span>
        <ConfirmDialog
          title={t("account.history.clearTitle")}
          description={t("account.history.clearText")}
          confirmLabel={t("account.history.clear")}
          destructive
          onConfirm={clear}
        >
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Trash2 className="size-4" />
            {t("account.history.clear")}
          </Button>
        </ConfirmDialog>
      </div>

      <ProductGrid>
        {items.map((item) => (
          <div key={item.id}>
            <ProductCard product={toProduct(item)} />

            <div className="mt-1.5 flex items-center justify-between gap-2 px-1">
              <span className="truncate text-xs text-muted-foreground">
                {t("account.history.viewedAt", {
                  date: formatDate(item.viewedAt, locale),
                })}
              </span>
              <button
                type="button"
                onClick={() => void remove(item.id)}
                title={t("account.history.remove")}
                className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" />
                {t("common.delete")}
              </button>
            </div>
          </div>
        ))}
      </ProductGrid>
    </div>
  );
}
