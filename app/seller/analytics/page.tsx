"use client";

import { useState } from "react";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import {
  DEFAULT_ANALYTICS_DAYS,
  ShopAnalytics,
} from "@/components/seller/shop-analytics";
import { ShopSearches } from "@/components/seller/shop-searches";
import { useSellerSubscription } from "@/lib/api/subscription";

/**
 * Аналитика магазина в кабинете продавца.
 *
 * Идентификатора магазина в адресе нет и быть не может: магазин у продавца один
 * и выводится сервером по владельцу токена. Отсюда же и отсутствие проверок
 * владения — чужой магазин сюда неоткуда взяться.
 *
 * Права страница не угадывает: и глубина периода, и доступ к поисковым запросам
 * с выгрузкой берутся из `useSellerSubscription()`. `plan` там уже посчитан по
 * сроку — у просроченного MAX это `free`, и страница закроется ровно так же,
 * как закроется сервер.
 */
export default function SellerAnalyticsPage() {
  const { t } = useT();
  const { shop, subscription, isLoading, isError } = useSellerSubscription();

  /**
   * Период живёт здесь, а не в переключателе: ту же глубину читает блок
   * поисковых запросов, и два независимых счётчика суток означали бы, что
   * график и список запросов показывают разные недели.
   */
  const [requestedDays, setRequestedDays] = useState<number>(
    DEFAULT_ANALYTICS_DAYS,
  );

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

  // Считать нечего, пока нечего продавать: единственный осмысленный путь —
  // форма создания магазина. Так же поступает и главная кабинета.
  if (!shop) {
    redirect("/seller/profile");
  }

  /**
   * Пока подписка не приехала, права берём самые скромные — те же, что у
   * магазина без подписки. Ошибка в эту же сторону: лучше показать закрытым
   * то, что открыто, чем открыть кнопку, за которой стоит 403.
   */
  const analyticsDays = subscription?.analyticsDays ?? DEFAULT_ANALYTICS_DAYS;
  const isMax = subscription?.plan === "max";

  /**
   * Глубина подрезается по тарифу, а не только блокировкой вкладки. Вкладка
   * закрывает обычный путь, а этот `min` — тот случай, когда тариф истёк или
   * был отменён администратором уже после того, как продавец выбрал 365 дней:
   * состояние на странице осталось прежним, а прав на него больше нет.
   */
  const days = Math.min(requestedDays, analyticsDays);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("seller.analytics.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("seller.analytics.subtitle")}
        </p>
      </div>

      {/*
        Подписка не загрузилась — страница остаётся рабочей на правах без
        подписки, но молчать об этом нельзя: иначе владелец MAX увидит замки на
        своих же разделах и решит, что у него отобрали тариф.
      */}
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
