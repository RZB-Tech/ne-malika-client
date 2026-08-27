"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  Handshake,
  HardDriveDownload,
  Loader2,
  Lock,
  Phone,
  Users,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import { TrendPanel, type TrendPoint } from "@/components/shared/charts";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/format";
import { downloadAnalyticsCsv } from "@/lib/api/analytics";
import { useSellerShopAnalyticsControllerSummary } from "@/lib/api/generated/endpoints/shop-analytics-seller/shop-analytics-seller";
import type { ShopDailyPointDto } from "@/lib/api/generated/schemas";

export const ANALYTICS_RANGES = [30, 90, 365] as const;

export const DEFAULT_ANALYTICS_DAYS = 30;

const TOP_LIMIT = 10;

export function ShopAnalytics({
  days,
  onDaysChange,
  analyticsDays,
  isMax,
}: {
  days: number;
  onDaysChange: (days: number) => void;
  analyticsDays: number;
  isMax: boolean;
}) {
  const { t, locale } = useT();
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, isError } = useSellerShopAnalyticsControllerSummary(
    { days },
    { query: { retry: false } },
  );

  const num = (value: number) => formatNumber(value, locale);

  const day = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  const series = (pick: (point: ShopDailyPointDto) => number): TrendPoint[] =>
    (data?.daily ?? []).map((point) => ({ date: point.date, value: pick(point) }));

  const hasLockedRange = ANALYTICS_RANGES.some((r) => r > analyticsDays);

  const exportCsv = async () => {
    setExporting(true);
    try {
      await downloadAnalyticsCsv(days);
    } catch {
      toast.error(t("seller.analytics.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Tabs
            value={String(days)}
            onValueChange={(value) => onDaysChange(Number(value))}
          >
            <TabsList>
              {ANALYTICS_RANGES.map((range) => {
                const locked = range > analyticsDays;
                return (
                  <TabsTrigger
                    key={range}
                    value={String(range)}
                    disabled={locked}
                  >
                    {locked && <Lock className="size-3.5" />}
                    {t(`seller.analytics.range${range}`)}
                    {}
                    {locked && (
                      <span className="sr-only">
                        {t("seller.analytics.rangeLocked")}
                      </span>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>

          {hasLockedRange && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              {t("seller.analytics.rangeHint")}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {data && (
            <span className="tabular text-xs text-muted-foreground">
              {t("seller.analytics.period", {
                from: day(data.from),
                to: day(data.to),
              })}
            </span>
          )}

          {isMax ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => void exportCsv()}
              disabled={exporting || !data}
            >
              {exporting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <HardDriveDownload className="size-4" />
              )}
              {exporting
                ? t("seller.analytics.exporting")
                : t("seller.analytics.export")}
            </Button>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5 shrink-0" />
              {t("seller.analytics.exportLocked")}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : isError || !data ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.analytics.loadFailed")}
        </Card>
      ) : data.views === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">{t("seller.analytics.empty")}</p>
          <p className="mx-auto mt-2 max-w-prose text-sm text-muted-foreground">
            {t("seller.analytics.emptyText")}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("seller.analytics.views")}
              value={num(data.views)}
              icon={Eye}
            />
            <StatCard
              label={t("seller.analytics.visits")}
              value={num(data.visits)}
              icon={Users}
              hint={t("seller.analytics.visitsHint")}
            />
            <StatCard
              label={t("seller.analytics.contacts")}
              value={num(data.contacts)}
              icon={Phone}
              hint={t("seller.analytics.contactsHint")}
            />
            {}
            <StatCard
              label={t("seller.analytics.conversion")}
              value={`${data.conversionPercent}%`}
              icon={Handshake}
            />
          </div>

          <Card className="p-5">
            <h2 className="font-medium">{t("seller.analytics.chart")}</h2>

            {}
            <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
              <TrendPanel
                label={t("seller.analytics.views")}
                total={num(data.views)}
                points={series((p) => p.views)}
                formatValue={num}
                formatDate={day}
              />
              <TrendPanel
                label={t("seller.analytics.visits")}
                total={num(data.visits)}
                points={series((p) => p.visitors)}
                formatValue={num}
                formatDate={day}
              />
              <TrendPanel
                label={t("seller.analytics.phoneClicks")}
                total={num(data.phoneClicks)}
                points={series((p) => p.phoneClicks)}
                formatValue={num}
                formatDate={day}
              />
              <TrendPanel
                label={t("seller.analytics.telegramClicks")}
                total={num(data.telegramClicks)}
                points={series((p) => p.telegramClicks)}
                formatValue={num}
                formatDate={day}
              />
              <TrendPanel
                label={t("seller.analytics.contactVisitors")}
                total={num(data.contactVisitors)}
                points={series((p) => p.contactVisitors)}
                formatValue={num}
                formatDate={day}
              />
            </div>
          </Card>

          <div>
            <h2 className="mb-3 font-heading text-lg font-bold tracking-tight">
              {t("seller.analytics.topProducts")}
            </h2>

            {data.topProducts.length === 0 ? (
              <Card className="py-12 text-center text-sm text-muted-foreground">
                {t("seller.analytics.topEmpty")}
              </Card>
            ) : (
              <Card className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="min-w-[220px]">
                          {t("seller.analytics.colProduct")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("seller.analytics.colViews")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("seller.analytics.colVisits")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("seller.analytics.colContacts")}
                        </TableHead>
                        <TableHead className="text-right">
                          {t("seller.analytics.colConversion")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topProducts.slice(0, TOP_LIMIT).map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="max-w-[320px]">
                            <Link
                              href={`/seller/products/${product.id}`}
                              className="block truncate text-sm font-medium hover:text-primary"
                            >
                              {product.name}
                            </Link>
                          </TableCell>
                          <TableCell className="tabular text-right text-sm">
                            {num(product.views)}
                          </TableCell>
                          <TableCell className="tabular text-right text-sm">
                            {num(product.visits)}
                          </TableCell>
                          <TableCell className="tabular text-right text-sm">
                            {num(product.contacts)}
                          </TableCell>
                          <TableCell className="tabular text-right text-sm">
                            {product.conversionPercent}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
}
