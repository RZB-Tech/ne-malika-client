"use client";

import type { AppIcon } from "@/components/icons";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  Coins,
  ImageIcon,
  Sparkles,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/providers/i18n-provider";
import { planLabel } from "@/lib/api/subscription";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SellerSubscriptionDto } from "@/lib/api/generated/schemas";

export function SubscriptionState({ subscription }: { subscription: SellerSubscriptionDto }) {
  const { t, locale } = useT();
  const s = subscription;

  const autofillLine = s.autofill.unlimited
    ? t("seller.subscription.autofillUnlimited")
    : s.autofill.left !== null
      ? t("seller.subscription.autofillFree", {
          left: s.autofill.left,
          limit: s.autofill.limit,
        })
      : t("seller.subscription.autofillNone");

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-muted-foreground">{t("seller.subscription.current")}</div>
            <div className="mt-1 font-heading text-2xl font-bold tracking-tight">
              {planLabel(s.plan, t)}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-transparent font-medium",
              s.active ? "bg-success/12 text-success" : "bg-muted text-muted-foreground",
            )}
          >
            {s.active ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
            {t(s.active ? "seller.subscription.active" : "seller.subscription.inactive")}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          {s.until ? (
            <span>
              {t("seller.subscription.until")}{" "}
              <span className="tabular font-medium">{formatDate(s.until, locale)}</span>
              {s.daysLeft !== null && (
                <span className="text-muted-foreground">
                  {" · "}
                  {s.daysLeft <= 1
                    ? t("seller.subscription.daysLeftLast")
                    : t("seller.subscription.daysLeft", { days: s.daysLeft })}
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{t("seller.subscription.untilNever")}</span>
          )}
        </div>

        {!s.active && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium">
              {t(s.until ? "seller.subscription.expired" : "seller.subscription.none")}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t(s.until ? "seller.subscription.expiredText" : "seller.subscription.noneText")}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Coins className="size-4 text-muted-foreground" />
          {t("seller.subscription.credits")}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Amount
            label={t("seller.subscription.creditsTotal")}
            hint={t("seller.subscription.creditsTotalHint")}
            value={(s.creditsBalance ?? 0) + (s.subscriptionCredits ?? 0)}
            accent
          />
          <Amount
            label={t("seller.subscription.creditsAvailable")}
            hint={t("seller.subscription.creditsAvailableHint")}
            value={s.available}
          />
        </div>

        {s.creditsReserved > 0 && (
          <div className="mt-3 text-xs text-muted-foreground">
            {t("seller.subscription.creditsReserved")}:{" "}
            <span className="tabular font-medium">{formatPrice(s.creditsReserved, locale)}</span>
          </div>
        )}

        <div className="mt-4 border-t pt-3 text-xs text-muted-foreground">
          <p>{t("seller.subscription.creditsUnifiedHint")}</p>
        </div>
      </Card>

      <Card className="p-5 lg:col-span-2">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={Sparkles}
            label={t("seller.subscription.autofill")}
            value={autofillLine}
            note={
              s.autofill.left !== null
                ? t("seller.subscription.autofillResets", {
                    date: formatDate(s.autofill.resetsAt, locale),
                  })
                : undefined
            }
          />
          <Feature
            icon={BarChart3}
            label={t("seller.subscription.promo")}
            value={t(s.promoted ? "seller.subscription.promoYes" : "seller.subscription.promoNo")}
          />
          <Feature
            icon={ImageIcon}
            label={t("seller.subscription.banner")}
            value={t(
              s.bannerSlots > 0 ? "seller.subscription.bannerYes" : "seller.subscription.bannerNo",
            )}
          />
          <Feature
            icon={CalendarDays}
            label={t("seller.subscription.analytics")}
            value={t("seller.subscription.analyticsDays", {
              days: s.analyticsDays,
            })}
          />
        </div>
      </Card>
    </div>
  );
}

function Amount({
  label,
  hint,
  value,
  accent,
}: {
  label: string;
  hint: string;
  value: number;
  accent?: boolean;
}) {
  const { locale } = useT();
  return (
    <div>
      <div className={cn("tabular font-heading text-2xl font-bold", accent && "text-primary")}>
        {formatPrice(value, locale)}
      </div>
      <div className="mt-0.5 text-sm font-medium">{label}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}

function Feature({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: AppIcon;
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="mt-0.5 text-sm text-muted-foreground">{value}</div>
        {note && <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>}
      </div>
    </div>
  );
}
