"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import { DEFAULT_ANALYTICS_DAYS, ShopAnalytics } from "@/components/seller/shop-analytics";
import { ShopSearches } from "@/components/seller/shop-searches";
import { useSellerSubscription } from "@/lib/api/subscription";

export default function SellerAnalyticsPage() {
  const { t } = useT();
  const { shop, subscription, isLoading, isError } = useSellerSubscription();

  const [requestedDays, setRequestedDays] = useState<number>(DEFAULT_ANALYTICS_DAYS);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!shop) {
    redirect("/seller/profile");
  }

  const analyticsDays = subscription?.analyticsDays ?? DEFAULT_ANALYTICS_DAYS;
  const isMax = subscription?.plan === "max";

  const days = Math.min(requestedDays, analyticsDays);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("seller.analytics.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("seller.analytics.subtitle")}</p>
      </div>

      {}
      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.subscription.loadFailed")}
        </Card>
      )}

      <ShopAnalytics
        days={days}
        onDaysChange={setRequestedDays}
        analyticsDays={analyticsDays}
        isMax={isMax}
      />

      <ShopSearches days={days} isMax={isMax} />
    </div>
  );
}
