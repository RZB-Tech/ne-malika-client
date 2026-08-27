"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Handshake,
  Scale,
  ShieldCheck,
  Store,
  TriangleAlert,
  Wallet,
  XCircle,
  type AppIcon,
} from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatCard } from "@/components/shared/stat-card";
import {
  BarList,
  StackedColumns,
  TrendPanel,
  type StackSeries,
  type TrendPoint,
} from "@/components/shared/charts";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber, formatPrice } from "@/lib/format";
import { planLabel } from "@/lib/api/subscription";
import { useAdminSubscriptionsControllerReport } from "@/lib/api/generated/endpoints/subscriptions-admin/subscriptions-admin";
import type {
  SubscriptionPlanSliceDtoPlan,
  SubscriptionReportDto,
  SubscriptionSalesPointDto,
} from "@/lib/api/generated/schemas";

const RANGES = [30, 90, 365] as const;

/** Порядковая шкала тарифов живёт в globals.css — там же обе темы. */
const PLAN_COLOR: Record<SubscriptionPlanSliceDtoPlan, string> = {
  start: "var(--plan-start)",
  pro: "var(--plan-pro)",
  max: "var(--plan-max)",
};

const PLANS: readonly SubscriptionPlanSliceDtoPlan[] = ["start", "pro", "max"];

/**
 * Состояния счётов — это статусы, а не ряды данных, поэтому у них свои
 * зарезервированные цвета и обязательная иконка: цвет здесь не единственный
 * носитель смысла.
 */
const STATUS_STYLE: Record<string, { color: string; icon: AppIcon }> = {
  paid: { color: "var(--success)", icon: CheckCircle2 },
  prepared: { color: "var(--warning)", icon: Clock },
  pending: { color: "var(--warning)", icon: Clock },
  cancelled: { color: "var(--muted-foreground)", icon: XCircle },
  failed: { color: "var(--destructive)", icon: TriangleAlert },
};

export function SubscriptionReport() {
  const { t, locale } = useT();
  const [days, setDays] = useState<number>(30);

  const { data, isLoading, isError } = useAdminSubscriptionsControllerReport(
    { days },
    { query: { retry: false } },
  );

  const money = (v: number) => `${formatPrice(v, locale)} ${t("common.currency")}`;
  const compactMoney = (v: number) => `${formatNumber(v, locale)} ${t("common.currency")}`;
  const num = (v: number) => formatNumber(v, locale);
  const day = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-medium">{t("admin.subsReport.salesTitle")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("admin.subsReport.salesSubtitle")}
            </p>
          </div>

          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <TabsList>
              {RANGES.map((r) => (
                <TabsTrigger key={r} value={String(r)}>
                  {t("admin.subsReport.days", { days: r })}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <Skeleton className="mt-6 h-32 w-full rounded-xl" />
        ) : isError || !data ? (
          <p className="mt-6 text-sm text-muted-foreground">{t("admin.subsReport.error")}</p>
        ) : (
          <>
            <div className="mt-6 grid gap-x-8 gap-y-7 sm:grid-cols-2">
              <TrendPanel
                label={t("admin.subsReport.revenue")}
                total={compactMoney(data.revenue)}
                points={series(data.daily, (p) => p.revenue)}
                formatValue={money}
                formatDate={day}
              />
              <TrendPanel
                label={t("admin.subsReport.payments")}
                total={num(data.payments)}
                points={series(data.daily, (p) => p.payments)}
                formatValue={num}
                formatDate={day}
              />
            </div>

            {(data.excludedTest > 0 || data.excludedRefunded > 0) && (
              <p className="mt-5 text-xs text-muted-foreground">
                {t("admin.subsReport.excluded", {
                  test: data.excludedTest,
                  refunded: data.excludedRefunded,
                })}
              </p>
            )}
          </>
        )}
      </Card>

      {isLoading ? (
        <Skeleton className="h-24 w-full rounded-xl" />
      ) : isError || !data ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t("admin.subsReport.revenue")}
              value={compactMoney(data.revenue)}
              icon={Wallet}
              hint={t("admin.subsReport.forPeriod")}
            />
            <StatCard
              label={t("admin.subsReport.avgCheck")}
              value={compactMoney(data.avgCheck)}
              icon={Scale}
              hint={t("admin.subsReport.paymentsCount", { count: data.payments })}
            />
            <StatCard
              label={t("admin.subsReport.payingShops")}
              value={num(data.payingShops)}
              icon={Store}
              hint={t("admin.subsReport.forPeriod")}
            />
            <StatCard
              label={t("admin.subsReport.activeShops")}
              value={num(data.activeShops)}
              icon={ShieldCheck}
              hint={t("admin.subsReport.rightNow")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              label={t("admin.subsReport.newRevenue")}
              value={compactMoney(data.newRevenue)}
              icon={Handshake}
              hint={t("admin.subsReport.newRevenueHint")}
            />
            <StatCard
              label={t("admin.subsReport.renewalRevenue")}
              value={compactMoney(data.renewalRevenue)}
              icon={Wallet}
              hint={t("admin.subsReport.renewalRevenueHint")}
            />
            <StatCard
              label={t("admin.subsReport.conversion")}
              value={`${data.conversion}%`}
              icon={CheckCircle2}
              hint={t("admin.subsReport.conversionHint")}
            />
          </div>

          <Card className="p-5">
            <h2 className="font-medium">{t("admin.subsReport.byPlanDaily")}</h2>
            <p className="mt-1 mb-5 text-sm text-muted-foreground">
              {t("admin.subsReport.byPlanDailySubtitle")}
            </p>
            <StackedColumns
              points={data.daily.map((p) => ({
                date: p.date,
                values: { start: p.start, pro: p.pro, max: p.max },
              }))}
              series={planSeries(t)}
              formatValue={money}
              formatDate={day}
              emptyLabel={t("admin.subsReport.empty")}
            />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="mb-5 font-medium">{t("admin.subsReport.byPlan")}</h2>
              <BarList
                data={data.byPlan.map((slice) => ({
                  label: planLabel(slice.plan, t),
                  value: slice.revenue,
                  color: PLAN_COLOR[slice.plan],
                }))}
                formatValue={compactMoney}
              />
              <PlanShopsNote data={data} />
            </Card>

            <Card className="p-5">
              <h2 className="mb-5 font-medium">{t("admin.subsReport.byProvider")}</h2>
              {data.byProvider.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.subsReport.empty")}</p>
              ) : (
                <BarList
                  data={data.byProvider.map((slice) => ({
                    label: t(`admin.subsReport.provider.${slice.provider}`),
                    value: slice.revenue,
                  }))}
                  formatValue={compactMoney}
                />
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="font-medium">{t("admin.subsReport.byStatus")}</h2>
              <p className="mt-1 mb-5 text-sm text-muted-foreground">
                {t("admin.subsReport.byStatusSubtitle")}
              </p>
              <StatusBreakdown data={data} />
            </Card>

            <Card className="p-5">
              <h2 className="mb-5 font-medium">{t("admin.subsReport.topShops")}</h2>
              {data.topShops.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("admin.subsReport.empty")}</p>
              ) : (
                <BarList
                  data={data.topShops.map((shop) => ({
                    label: shop.name,
                    value: shop.revenue,
                  }))}
                  formatValue={compactMoney}
                />
              )}
            </Card>
          </div>

          <Card className="p-5">
            <DailyTable rows={data.daily} />
          </Card>
        </>
      )}
    </div>
  );
}

function series(
  daily: SubscriptionSalesPointDto[],
  pick: (p: SubscriptionSalesPointDto) => number,
): TrendPoint[] {
  return daily.map((p) => ({ date: p.date, value: pick(p) }));
}

function planSeries(t: (key: string) => string): StackSeries[] {
  return PLANS.map((plan) => ({
    key: plan,
    label: planLabel(plan, t),
    color: PLAN_COLOR[plan],
  }));
}

/** Срез на сейчас: график выше — про деньги за период, это — про живые подписки. */
function PlanShopsNote({ data }: { data: SubscriptionReportDto }) {
  const { t, locale } = useT();
  const active = data.activeByPlan.filter((row) => row.shops > 0);
  if (active.length === 0) return null;

  return (
    <p className="mt-5 border-t pt-4 text-xs text-muted-foreground">
      {t("admin.subsReport.activeByPlan")}:{" "}
      {active
        .map((row) => `${planLabel(row.plan, t)} — ${formatNumber(row.shops, locale)}`)
        .join(" · ")}
    </p>
  );
}

function StatusBreakdown({ data }: { data: SubscriptionReportDto }) {
  const { t, locale } = useT();

  if (data.byStatus.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("admin.subsReport.empty")}</p>;
  }

  const max = Math.max(...data.byStatus.map((s) => s.payments), 1);

  return (
    <div className="space-y-3">
      {data.byStatus.map((slice) => {
        const style = STATUS_STYLE[slice.status];
        const Icon = style?.icon ?? Clock;
        return (
          <div
            key={slice.status}
            className="grid grid-cols-[auto_7rem_1fr_auto] items-center gap-3 text-sm"
          >
            <Icon className="size-4 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {t(`admin.subsReport.status.${slice.status}`)}
            </span>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(slice.payments / max) * 100}%`,
                  background: style?.color ?? "var(--muted-foreground)",
                }}
              />
            </div>
            <span className="tabular text-right font-medium">
              {formatNumber(slice.payments, locale)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DailyTable({ rows }: { rows: SubscriptionSalesPointDto[] }) {
  const { t, locale } = useT();
  const filled = rows.filter((r) => r.payments > 0 || r.revenue > 0);

  if (filled.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("admin.subsReport.empty")}</p>;
  }

  const money = (v: number) => formatPrice(v, locale);

  return (
    <details>
      <summary className="cursor-pointer text-sm text-muted-foreground">
        {t("admin.subsReport.table")}
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground">
              <th className="py-1 pr-4 font-normal">{t("admin.subsReport.date")}</th>
              <th className="py-1 pr-4 font-normal">{t("admin.subsReport.revenue")}</th>
              <th className="py-1 pr-4 font-normal">{t("admin.subsReport.payments")}</th>
              {PLANS.map((plan) => (
                <th key={plan} className="py-1 pr-4 font-normal">
                  {planLabel(plan, t)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular">
            {filled.map((r) => (
              <tr key={r.date} className="border-t">
                <td className="py-1 pr-4 text-muted-foreground">{r.date}</td>
                <td className="py-1 pr-4">{money(r.revenue)}</td>
                <td className="py-1 pr-4">{formatNumber(r.payments, locale)}</td>
                {PLANS.map((plan) => (
                  <td key={plan} className="py-1 pr-4">
                    {money(r[plan])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
