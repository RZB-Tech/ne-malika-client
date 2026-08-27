"use client";

import Link from "next/link";
import { Lock, Wallet } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarList } from "@/components/shared/charts";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/format";
import { useSellerShopAnalyticsControllerSearches } from "@/lib/api/generated/endpoints/shop-analytics-seller/shop-analytics-seller";

/** Сколько запросов показывать. Сервер по умолчанию отдаёт столько же. */
const SEARCH_LIMIT = 20;

/**
 * По каким словам покупатели находили товары магазина. Только на тарифе MAX.
 *
 * Гейт стоит на самом запросе (`enabled: isMax`), а не только на разметке:
 * ручка отвечает 403 всем, кроме MAX, и звать её ради заведомого отказа значило
 * бы писать в журнал сервера ошибку на каждый заход продавца на START.
 *
 * Данные при этом копятся всегда, независимо от тарифа, — об этом прямо сказано
 * в тексте замка: подписавшись, продавец увидит и то, что было до подписки, а
 * не пустой отчёт с сегодняшнего дня.
 */
export function ShopSearches({
  days,
  isMax,
}: {
  /** Та же глубина, что и у сводки: один период на всю страницу. */
  days: number;
  isMax: boolean;
}) {
  const { t, locale } = useT();

  const { data, isLoading, isError } = useSellerShopAnalyticsControllerSearches(
    { days, limit: SEARCH_LIMIT },
    { query: { enabled: isMax, retry: false } },
  );

  const rows = (data ?? []).map((hit) => ({
    label: hit.query,
    value: hit.shows,
  }));

  return (
    <div>
      <h2 className="font-heading text-lg font-bold tracking-tight">
        {t("seller.analytics.searches")}
      </h2>
      <p className="mt-1 mb-3 text-sm text-muted-foreground">
        {t("seller.analytics.searchesSubtitle")}
      </p>

      {!isMax ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="size-4 text-muted-foreground" />
            {t("seller.analytics.searchesLocked")}
          </div>
          <p className="mt-2 max-w-prose text-sm text-muted-foreground">
            {t("seller.analytics.searchesLockedText")}
          </p>
          <Button asChild size="sm" className="mt-4 w-fit gap-2">
            <Link href="/seller/subscription">
              <Wallet className="size-4" />
              {t("seller.analytics.upgrade")}
            </Link>
          </Button>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : isError ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.analytics.searchesFailed")}
        </Card>
      ) : rows.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          {t("seller.analytics.searchesEmpty")}
        </Card>
      ) : (
        <Card className="p-5">
          {/* Сетка повторяет сетку BarList — иначе подписи разъедутся со столбцами. */}
          <div className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 border-b pb-2 text-xs text-muted-foreground">
            <span>{t("seller.analytics.colQuery")}</span>
            <span />
            <span className="text-right">
              {t("seller.analytics.colShows")}
            </span>
          </div>
          <div className="mt-4">
            <BarList data={rows} formatValue={(v) => formatNumber(v, locale)} />
          </div>
        </Card>
      )}
    </div>
  );
}
