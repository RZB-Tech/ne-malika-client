"use client";

import { useMemo } from "react";
import { Flag, Package, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { BarList } from "@/components/shared/charts";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/format";
import { useAdminShopsControllerList } from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import { useProductCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { useAdminReportsControllerFindAll } from "@/lib/api/generated/endpoints/reports/reports";
import { hueFromId } from "@/lib/api/mappers";
import {
  devFallback,
  devFallbackPage,
  devProducts,
  devReports,
  devShops,
} from "@/lib/api/dev-fixtures";
import type {
  AdminShopRow,
  Paginated,
  PublicProductCard,
  ReportRow,
} from "@/lib/api/types";

export default function AdminStats() {
  const { t, locale } = useT();

  const shopsQuery = useAdminShopsControllerList({
    query: { select: (raw) => raw as unknown as AdminShopRow[], retry: false },
  });

  // limit: 1 — нужны только счётчики из meta, сами строки не читаем.
  const productsQuery = useProductCardsControllerFindAll(
    { limit: 1 },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<PublicProductCard>,
      },
    },
  );
  const reportsQuery = useAdminReportsControllerFindAll(
    { limit: 1 },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<ReportRow>,
        retry: false,
      },
    },
  );

  const shops = useMemo(
    () => devFallback(shopsQuery.data, devShops),
    [shopsQuery.data],
  );
  const productsTotal = devFallbackPage(productsQuery.data, devProducts).meta
    .total;
  const reportsTotal = devFallbackPage(reportsQuery.data, devReports).meta.total;
  const activeShops = shops.filter((s) => s.status === "active").length;

  const topShops = useMemo(
    () =>
      [...shops]
        .sort((a, b) => b.productCount - a.productCount)
        .slice(0, 8)
        .map((s) => ({
          label: s.name,
          value: s.productCount,
          hue: hueFromId(s.id),
        })),
    [shops],
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.stats.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Данные из базы. Просмотры и переходы в Telegram считает
          Яндекс.Метрика — они видны в карточке товара у продавца.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Магазинов"
          value={formatNumber(shops.length, locale)}
          icon={Store}
        />
        <StatCard
          label="Активных магазинов"
          value={formatNumber(activeShops, locale)}
          icon={Store}
        />
        <StatCard
          label="Товаров в выдаче"
          value={formatNumber(productsTotal, locale)}
          icon={Package}
        />
        <StatCard
          label="Жалоб"
          value={formatNumber(reportsTotal, locale)}
          icon={Flag}
        />
      </div>

      <Card className="p-5">
        <h2 className="mb-5 font-medium">Магазины по числу товаров</h2>
        {topShops.length === 0 ? (
          <p className="text-sm text-muted-foreground">Данных пока нет.</p>
        ) : (
          <BarList data={topShops} formatValue={(v) => String(v)} />
        )}
      </Card>
    </div>
  );
}
