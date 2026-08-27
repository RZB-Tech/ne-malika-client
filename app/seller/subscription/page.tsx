"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubscriptionCredits } from "@/components/seller/subscription-credits";
import { SubscriptionPayments } from "@/components/seller/subscription-payments";
import { SubscriptionPlans } from "@/components/seller/subscription-plans";
import { SubscriptionState } from "@/components/seller/subscription-state";
import { useT } from "@/components/providers/i18n-provider";
import { useSellerSubscription } from "@/lib/api/subscription";

/**
 * Подписка магазина: состояние, витрина тарифов, история платежей и журнал
 * кредитов.
 *
 * Страница целиком клиентская. Всё, что на ней есть, — про конкретного
 * владельца и живёт за `@SellerOnly()`; отдавать её сервером значило бы
 * рендерить пустую разметку и тут же перерисовывать её данными.
 *
 * Ни в одну ручку идентификатор магазина не передаётся: у продавца магазин
 * один, и сервер выводит его по владельцу. Отсюда и порядок проверок ниже —
 * без магазина подписывать нечего, и спрашивать сервер не о чем.
 */
export default function SellerSubscriptionPage() {
  const { t } = useT();
  const { shop, subscription, isLoading, isError } = useSellerSubscription();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("seller.subscription.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("seller.subscription.subtitle")}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : !shop ? (
        /* Магазина нет — вести отсюда некуда, кроме формы его создания. */
        <Card className="items-start gap-3 p-6 text-sm">
          <p className="text-muted-foreground">
            {t("seller.subscription.needShop")}
          </p>
          <Button asChild>
            <Link href="/seller/profile">{t("seller.nav.profile")}</Link>
          </Button>
        </Card>
      ) : isError || !subscription ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.subscription.loadFailed")}
        </Card>
      ) : (
        <>
          <SubscriptionState subscription={subscription} />
          <SubscriptionPlans subscription={subscription} />
          <SubscriptionPayments />
          <SubscriptionCredits />
        </>
      )}
    </div>
  );
}
