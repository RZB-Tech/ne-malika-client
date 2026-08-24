"use client";

import { useMemo } from "react";
import { Flag, Package, Store } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { BarList } from "@/components/shared/charts";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useT } from "@/components/providers/i18n-provider";
import { ActivityCharts } from "@/components/admin/activity-charts";
import { NotificationsCard } from "@/components/shared/notifications-card";
import { formatNumber } from "@/lib/format";
import { useAdminShopsControllerList } from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import { useProductCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { useAdminReportsControllerFindAll } from "@/lib/api/generated/endpoints/reports/reports";
import { hueFromId } from "@/lib/api/mappers";
import {
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

  const shopsQuery = useAdminShopsControllerList(
    { limit: 100 },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AdminShopRow>,
        retry: false,
      },
    },
  );

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
    () => devFallbackPage(shopsQuery.data, devShops).data,
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
      <AdminPageHeader
        title={t("admin.stats.title")}
        subtitle={t("admin.dashboard.note")}
      />

      <NotificationsCard />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("admin.dashboard.shops")}
          value={formatNumber(shops.length, locale)}
          icon={Store}
        />
        <StatCard
          label={t("admin.dashboard.activeShops")}
          value={formatNumber(activeShops, locale)}
          icon={Store}
        />
        <StatCard
          label={t("admin.dashboard.productsLive")}
          value={formatNumber(productsTotal, locale)}
          icon={Package}
        />
        <StatCard
          label={t("admin.dashboard.reports")}
          value={formatNumber(reportsTotal, locale)}
          icon={Flag}
        />
      </div>

      <ActivityCharts />

      <Card className="p-5">
        <h2 className="mb-5 font-medium">{t("admin.dashboard.topShops")}</h2>
        {topShops.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t("admin.dashboard.noData")}
          </p>
        ) : (
          <BarList data={topShops} formatValue={(v) => String(v)} />
        )}
      </Card>
    </div>
  );
}
