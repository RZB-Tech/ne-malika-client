"use client";

import { Eye } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import { useSellerProductStatsControllerStats } from "@/lib/api/generated/endpoints/product-stats-seller/product-stats-seller";

const DAYS = 30;

export function ProductStatsCard({ productId }: { productId: number }) {
  const { t } = useT();
  const { data, isLoading, isError, error } = useSellerProductStatsControllerStats(
    productId,
    { days: DAYS },
    { query: { retry: false } },
  );

  if (isLoading) return <Skeleton className="h-28 w-full rounded-2xl" />;
  if (isError || !data) {
    return (
      <Card className="p-6 text-sm text-muted-foreground">
        {error instanceof Error
          ? t("seller.stats.error", { status: error.message })
          : t("seller.stats.unavailable")}
      </Card>
    );
  }

  if (data.views === 0) {
    return (
      <Card className="p-6">
        <Title />
        <p className="mt-3 text-sm text-muted-foreground">{t("seller.stats.empty")}</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Title />

      <div className="mt-4 flex flex-wrap items-end gap-x-10 gap-y-4">
        <Stat label={t("seller.stats.days30")} value={data.views} />
        <Stat label={t("seller.stats.days7")} value={data.views7d} />
        <Stat label={t("seller.stats.visits")} value={data.visits} />
        <Sparkline points={data.daily.map((d) => d.views)} />
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-x-10 gap-y-4 border-t pt-5">
        <Stat label={t("seller.stats.phoneShows")} value={data.phoneClicks} />
        <Stat label={t("seller.stats.telegramClicks")} value={data.telegramClicks} />
        <Conversion reached={data.contactVisitors} visits={data.visits} />
      </div>
    </Card>
  );
}

function Title() {
  const { t } = useT();
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Eye className="size-4 text-muted-foreground" />
      {t("seller.stats.title")}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="tabular text-2xl font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Conversion({ reached, visits }: { reached: number; visits: number }) {
  const { t } = useT();
  if (visits === 0) return null;

  return (
    <div>
      <div className="tabular text-2xl font-semibold">{Math.round((reached / visits) * 100)}%</div>
      <div className="text-xs text-muted-foreground">{t("seller.stats.reachedContact")}</div>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  if (max === 0) return null;

  return (
    <div className="ml-auto flex h-10 items-end gap-0.5" aria-hidden>
      {points.map((value, i) => (
        <div
          key={i}
          className="w-1 rounded-t-sm bg-primary/25"
          style={{ height: `${Math.max(8, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
