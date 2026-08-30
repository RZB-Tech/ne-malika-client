"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, TriangleAlert, X } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import { planLabel, planRank } from "@/lib/api/subscription";
import { PAYME_ENABLED } from "@/lib/payments";
import { formatDate, formatPrice } from "@/lib/format";
import { GOALS, reachGoal } from "@/lib/metrika";
import { cn } from "@/lib/utils";
import { useSubscriptionsControllerPlans } from "@/lib/api/generated/endpoints/subscriptions-public/subscriptions-public";
import { useSellerSubscriptionsControllerCheckout } from "@/lib/api/generated/endpoints/subscriptions-seller/subscriptions-seller";
import type {
  CreateCheckoutDtoProvider,
  SellerSubscriptionDto,
  SubscriptionPlanDto,
} from "@/lib/api/generated/schemas";
import type { PaidPlan } from "@/lib/api/types";

export function SubscriptionPlans({ subscription }: { subscription: SellerSubscriptionDto }) {
  const { t, locale } = useT();
  const [busy, setBusy] = useState<PaidPlan | null>(null);

  const { data, isLoading, isError } = useSubscriptionsControllerPlans({
    query: { retry: false },
  });
  const checkout = useSellerSubscriptionsControllerCheckout();

  const plans = useMemo(
    () => [...(data ?? [])].sort((a, b) => planRank(a.id) - planRank(b.id)),
    [data],
  );
  const topId = plans.at(-1)?.id;
  const secondId = plans.length >= 3 ? plans.at(-2)?.id : undefined;

  const warning = !subscription.active
    ? subscription.subscriptionCredits > 0
      ? t("seller.subscription.warnBurn", {
          credits: formatPrice(subscription.subscriptionCredits, locale),
        })
      : null
    : subscription.until
      ? t("seller.subscription.warnUpgrade", {
          date: formatDate(subscription.until, locale),
        })
      : null;

  const pay = async (plan: PaidPlan, provider: CreateCheckoutDtoProvider) => {
    setBusy(plan);
    try {
      const link = await checkout.mutateAsync({ data: { plan, provider } });
      // Уход на кассу — последнее, что мы видим на своём домене: дальше
      // человек уже на стороне Payme или Click. Цель ставим до редиректа.
      reachGoal(GOALS.subscriptionCheckout, { plan, provider });
      window.location.assign(link.url);
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "seller.subscription.payFailed"));
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold tracking-tight">{t("seller.plans.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("seller.plans.subtitle")}</p>
      </div>

      {warning && (
        <Card className="border-warning/40 bg-warning/5 p-4">
          <div className="flex gap-2 text-sm">
            <TriangleAlert className="size-4 shrink-0 text-warning" />
            <p>{warning}</p>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.plans.loadFailed")}
        </Card>
      ) : plans.length === 0 ? (
        <Card className="py-12 text-center text-sm text-muted-foreground">
          {t("seller.plans.empty")}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              current={subscription.active && subscription.plan === plan.id}
              renewable={subscription.active}
              top={plan.id === topId}
              second={plan.id === secondId}
              busy={busy === plan.id}
              disabled={busy !== null}
              onPay={(provider) => void pay(plan.id, provider)}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{t("seller.subscription.payHint")}</p>
    </div>
  );
}

function PlanCard({
  plan,
  current,
  renewable,
  top,
  second,
  busy,
  disabled,
  onPay,
}: {
  plan: SubscriptionPlanDto;
  current: boolean;
  renewable: boolean;
  top: boolean;
  second: boolean;
  busy: boolean;
  disabled: boolean;
  onPay: (provider: CreateCheckoutDtoProvider) => void;
}) {
  const { t, locale } = useT();

  return (
    <Card className={cn("gap-0 p-5", current && "ring-2 ring-primary")}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-heading text-lg font-bold tracking-tight">{planLabel(plan.id, t)}</h3>
        {current ? (
          <Badge>{t("seller.plans.current")}</Badge>
        ) : top ? (
          <Badge variant="outline" className="border-transparent bg-primary/10 text-primary">
            {t("seller.plans.best")}
          </Badge>
        ) : second ? (
          <Badge variant="outline" className="border-transparent bg-muted text-muted-foreground">
            {t("seller.plans.recommended")}
          </Badge>
        ) : null}
      </div>

      <div className="mt-2 font-heading text-2xl font-bold tabular">
        {t("seller.plans.perMonth", {
          price: formatPrice(plan.priceUzs, locale),
        })}
      </div>

      <p className="mt-2 text-sm text-muted-foreground">{t(`seller.plans.${plan.id}.note`)}</p>

      <ul className="mt-4 space-y-2 text-sm">
        <FeatureLine
          text={t("seller.plans.creditsLine", {
            credits: formatPrice(plan.credits, locale),
          })}
        />
        <FeatureLine
          text={
            plan.freeAutofills === null
              ? t("seller.plans.autofillUnlimitedLine")
              : t("seller.plans.autofillLine", { count: plan.freeAutofills })
          }
        />
        <FeatureLine
          off={!plan.promoted}
          text={
            !plan.promoted
              ? t("seller.plans.promoNoLine")
              : top
                ? t("seller.plans.promoHigherLine")
                : t("seller.plans.promoLine")
          }
        />
        <FeatureLine
          off={plan.bannerSlots === 0}
          text={t(plan.bannerSlots > 0 ? "seller.plans.bannerLine" : "seller.plans.bannerNoLine")}
        />
        <FeatureLine
          text={
            top
              ? t("seller.plans.analyticsMaxLine", { days: plan.analyticsDays })
              : t("seller.plans.analyticsLine", { days: plan.analyticsDays })
          }
        />
      </ul>

      <Button
        className="mt-5 w-full"
        variant={current || !renewable ? "default" : "outline"}
        disabled={disabled}
        onClick={() => onPay("click")}
      >
        {busy && <Loader2 className="size-4 animate-spin" />}
        {busy
          ? t("seller.subscription.paying")
          : PAYME_ENABLED
            ? t("seller.subscription.payClick")
            : current
              ? t("seller.subscription.renew")
              : renewable
                ? t("seller.subscription.change")
                : t("seller.subscription.pay")}
      </Button>

      {PAYME_ENABLED && (
        <Button
          className="mt-2 w-full"
          variant="outline"
          disabled={disabled}
          onClick={() => onPay("payme")}
        >
          {t("seller.subscription.payPayme")}
        </Button>
      )}
    </Card>
  );
}

function FeatureLine({ text, off }: { text: string; off?: boolean }) {
  return (
    <li className={cn("flex gap-2", off && "text-muted-foreground")}>
      {off ? (
        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      ) : (
        <Check className="mt-0.5 size-4 shrink-0 text-success" />
      )}
      <span>{text}</span>
    </li>
  );
}
