"use client";

import { notFound } from "next/navigation";
import { RefreshCw } from "@/components/icons";
import { StoreDetail } from "@/components/store/store-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusPanel } from "@/components/shared/status-panel";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { PageContainer } from "@/components/layout/page-container";
import { useT } from "@/components/providers/i18n-provider";
import { useShopsControllerGetPublic } from "@/lib/api/generated/endpoints/shops-public/shops-public";
import { mapProductRow, mapShop } from "@/lib/api/mappers";
import type { PublicShop } from "@/lib/api/types";
import type { AxiosError } from "axios";

export function StoreDetailConnected({ id }: { id: number }) {
  const { t } = useT();
  const { data, isLoading, isError, error, refetch } = useShopsControllerGetPublic(
    id,
    {
      query: {
        select: (raw) => raw as unknown as PublicShop,
        retry: false,
      },
    },
  );

  if (isLoading) {
    return (
      <PageContainer className="py-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <ProductGridSkeleton count={4} className="mt-10" />
      </PageContainer>
    );
  }

  /**
   * 404 — магазина действительно нет: notFound(). Остальное (сеть, 5xx) —
   * временный сбой: показываем ошибку с повтором, а не хороним живой URL.
   */
  if (isError || !data) {
    const status = (error as AxiosError | null)?.response?.status;
    if (status === 404) notFound();
    return (
      <PageContainer className="py-16">
        <StatusPanel
          tone="error"
          title={t("catalog.errorTitle")}
          description={t("catalog.loadError")}
          action={
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw data-icon="inline-start" />
              {t("common.retry")}
            </Button>
          }
        />
      </PageContainer>
    );
  }

  const store = mapShop(data);
  const products = (data.productCards ?? []).map((pc) =>
    mapProductRow(pc, data.name),
  );

  return <StoreDetail store={store} products={products} />;
}
