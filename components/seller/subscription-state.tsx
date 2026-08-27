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

/**
 * Текущее состояние подписки: тариф, срок, оба кармана кредитов и то, что
 * тариф даёт прямо сейчас.
 *
 * Тариф здесь всегда ДЕЙСТВУЮЩИЙ — сервер считает его по сроку. У магазина с
 * истёкшей подпиской придёт `free`, хотя в колонке магазина по-прежнему лежит
 * купленный когда-то `max`; показывать вторую вместо первой значило бы обещать
 * продавцу возможности, которых у него уже нет.
 *
 * Два кармана кредитов разведены намеренно. Подписочные выдаются при каждой
 * оплате и сгорают, если срок успел выйти; купленные не сгорают никогда. Одно
 * общее число на их месте оставило бы продавца наедине с вопросом «почему было
 * 6000, а стало 3000» — и это ровно тот вопрос, ради которого заведена история
 * кредитов ниже по странице.
 */
export function SubscriptionState({
  subscription,
}: {
  subscription: SellerSubscriptionDto;
}) {
  const { t, locale } = useT();
  const s = subscription;

  /**
   * Остаток бесплатных автозаполнений: счётчик существует только у тарифа с
   * конечной нормой. У безлимитных и у магазина без подписки сервер шлёт
   * `null` — и это не ноль: ноль читается как «попытки кончились», что для
   * владельца PRO прямо неверно.
   */
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
            <div className="text-sm text-muted-foreground">
              {t("seller.subscription.current")}
            </div>
            <div className="mt-1 font-heading text-2xl font-bold tracking-tight">
              {planLabel(s.plan, t)}
            </div>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-transparent font-medium",
              s.active
                ? "bg-success/12 text-success"
                : "bg-muted text-muted-foreground",
            )}
          >
            {s.active ? (
              <CheckCircle2 className="size-3" />
            ) : (
              <Clock className="size-3" />
            )}
            {t(
              s.active
                ? "seller.subscription.active"
                : "seller.subscription.inactive",
            )}
          </Badge>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm">
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
          {s.until ? (
            <span>
              {t("seller.subscription.until")}{" "}
              <span className="tabular font-medium">
                {formatDate(s.until, locale)}
              </span>
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
            <span className="text-muted-foreground">
              {t("seller.subscription.untilNever")}
            </span>
          )}
        </div>

        {!s.active && (
          <div className="mt-4 rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium">
              {t(
                s.until
                  ? "seller.subscription.expired"
                  : "seller.subscription.none",
              )}
            </p>
            <p className="mt-1 text-muted-foreground">
              {t(
                s.until
                  ? "seller.subscription.expiredText"
                  : "seller.subscription.noneText",
              )}
            </p>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Coins className="size-4 text-muted-foreground" />
          {t("seller.subscription.credits")}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <Amount
            label={t("seller.subscription.creditsSubscription")}
            hint={t("seller.subscription.creditsSubscriptionHint")}
            value={s.subscriptionCredits}
          />
          <Amount
            label={t("seller.subscription.creditsOwn")}
            hint={t("seller.subscription.creditsOwnHint")}
            value={s.creditsBalance}
          />
          <Amount
            label={t("seller.subscription.creditsAvailable")}
            hint={t("seller.subscription.creditsAvailableHint")}
            value={s.available}
            accent
          />
        </div>

        <div className="mt-4 space-y-1 border-t pt-4 text-xs text-muted-foreground">
          <p>{t("seller.subscription.creditsSpendOrder")}</p>
          {s.creditsReserved > 0 && (
            <p>
              {t("seller.subscription.creditsReserved")}:{" "}
              <span className="tabular">
                {formatPrice(s.creditsReserved, locale)}
              </span>
            </p>
          )}
          {/*
            Запертые кредиты — не сгоревшие: они лежат в магазине и ждут
            следующей оплаты, но потратить их нельзя. Молча вычесть их из
            «Доступно сейчас» и не сказать об этом значило бы показать пропажу
            без объяснения.
          */}
          {!s.active && s.subscriptionCredits > 0 && (
            <p className="text-warning">
              {t("seller.subscription.creditsLocked")}:{" "}
              <span className="tabular">
                {formatPrice(s.subscriptionCredits, locale)}
              </span>
            </p>
          )}
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
            value={t(
              s.promoted
                ? "seller.subscription.promoYes"
                : "seller.subscription.promoNo",
            )}
          />
          <Feature
            icon={ImageIcon}
            label={t("seller.subscription.banner")}
            value={t(
              s.bannerSlots > 0
                ? "seller.subscription.bannerYes"
                : "seller.subscription.bannerNo",
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

/**
 * Число кредитов.
 *
 * `formatPrice`, а не `formatNumber`: второй с десяти тысяч переходит на
 * «10 тыс.», а остаток кредитов надо видеть до единицы — по нему решают,
 * хватит ли на генерацию.
 */
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
      <div
        className={cn(
          "tabular font-heading text-2xl font-bold",
          accent && "text-primary",
        )}
      >
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
        {note && (
          <div className="mt-0.5 text-xs text-muted-foreground">{note}</div>
        )}
      </div>
    </div>
  );
}
