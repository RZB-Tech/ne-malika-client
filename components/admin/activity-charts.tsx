"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/components/providers/i18n-provider";
import { TrendPanel, type TrendPoint } from "@/components/shared/charts";
import { formatNumber } from "@/lib/format";
import { useAdminStatsControllerActivity } from "@/lib/api/generated/endpoints/stats-admin/stats-admin";
import type { ActivityPointDto } from "@/lib/api/generated/schemas";

const RANGES = [30, 90, 365] as const;

export function ActivityCharts() {
  const { t, locale } = useT();
  const [days, setDays] = useState<number>(30);

  const { data, isLoading, isError } = useAdminStatsControllerActivity(
    { days },
    { query: { retry: false } },
  );

  const num = (v: number) => formatNumber(v, locale);
  const day = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  const series = (pick: (p: ActivityPointDto) => number): TrendPoint[] =>
    (data?.daily ?? []).map((p) => ({ date: p.date, value: pick(p) }));

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-medium">{t("admin.activity.title")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("admin.activity.subtitle")}
          </p>
        </div>

        <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r} value={String(r)}>
                {t("admin.activity.days", { days: r })}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <Skeleton className="mt-6 h-32 w-full rounded-xl" />
      ) : isError || !data ? (
        <p className="mt-6 text-sm text-muted-foreground">
          {t("admin.activity.error")}
        </p>
      ) : (
        <>
          <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2 xl:grid-cols-3">
            <TrendPanel
              label={t("admin.activity.products")}
              total={num(data.productsTotal)}
              points={series((p) => p.products)}
              formatValue={num}
              formatDate={day}
            />
            <TrendPanel
              label={t("admin.activity.shops")}
              total={num(data.shopsTotal)}
              points={series((p) => p.shops)}
              formatValue={num}
              formatDate={day}
            />
            <TrendPanel
              label={t("admin.activity.users")}
              total={num(data.usersTotal)}
              points={series((p) => p.users)}
              formatValue={num}
              formatDate={day}
            />
            <TrendPanel
              label={t("admin.activity.views")}
              total={num(data.viewsTotal)}
              points={series((p) => p.views)}
              formatValue={num}
              formatDate={day}
            />
            <TrendPanel
              label={t("admin.activity.contacts")}
              total={num(data.contactsTotal)}
              points={series((p) => p.contacts)}
              formatValue={num}
              formatDate={day}
            />
          </div>

          <ActivityTable rows={data.daily} />
        </>
      )}
    </Card>
  );
}

function ActivityTable({ rows }: { rows: ActivityPointDto[] }) {
  const { t, locale } = useT();
  const filled = rows.filter(
    (r) => r.products || r.shops || r.users || r.views || r.contacts,
  );

  if (filled.length === 0) {
    return (
      <p className="mt-6 text-sm text-muted-foreground">
        {t("admin.activity.empty")}
      </p>
    );
  }

  return (
    <details className="mt-6">
      <summary className="cursor-pointer text-sm text-muted-foreground">
        {t("admin.activity.title")}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 pr-4 font-normal">
                {t("admin.activity.range")}
              </th>
              <th className="py-1 pr-4 font-normal">
                {t("admin.activity.products")}
              </th>
              <th className="py-1 pr-4 font-normal">
                {t("admin.activity.shops")}
              </th>
              <th className="py-1 pr-4 font-normal">
                {t("admin.activity.users")}
              </th>
              <th className="py-1 pr-4 font-normal">
                {t("admin.activity.views")}
              </th>
              <th className="py-1 font-normal">
                {t("admin.activity.contacts")}
              </th>
            </tr>
          </thead>
          <tbody className="tabular">
            {filled.map((r) => (
              <tr key={r.date} className="border-t">
                <td className="py-1 pr-4 text-muted-foreground">{r.date}</td>
                <td className="py-1 pr-4">{formatNumber(r.products, locale)}</td>
                <td className="py-1 pr-4">{formatNumber(r.shops, locale)}</td>
                <td className="py-1 pr-4">{formatNumber(r.users, locale)}</td>
                <td className="py-1 pr-4">{formatNumber(r.views, locale)}</td>
                <td className="py-1">{formatNumber(r.contacts, locale)}</td>
            </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
