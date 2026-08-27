"use client";

import { useSellerSubscriptionsControllerState } from "./generated/endpoints/subscriptions-seller/subscriptions-seller";
import { useSellerShop } from "./seller";
import type { PaidPlan, SubscriptionPlan } from "./types";

/**
 * Тарифы по возрастанию — единственный порядок, в котором их показывают и
 * сравнивают.
 *
 * `free` стоит в списке первым, но продать его нельзя: это состояние «подписки
 * нет». Витрине тарифов нужен `PAID_PLANS`, сравнению «выше/ниже» — весь
 * список, иначе переход с истёкшей подписки на START не отличить от смены
 * тарифа.
 */
export const PLAN_ORDER = ["free", "start", "pro", "max"] as const;

/** Что можно купить на кассе. */
export const PAID_PLANS = ["start", "pro", "max"] as const;

/**
 * Место тарифа в лестнице: 0 у `free`, 3 у MAX.
 *
 * Нужно ровно для одного вопроса — «этот тариф выше текущего?», от которого
 * зависит, какое из двух предупреждений показать рядом с кнопкой оплаты
 * (`warnUpgrade` против `warnBurn`). Неизвестное значение с сервера считаем
 * `free`: так подпись окажется осторожной, а не отсутствующей.
 */
export function planRank(plan: SubscriptionPlan): number {
  const index = PLAN_ORDER.indexOf(plan as (typeof PLAN_ORDER)[number]);
  return index < 0 ? 0 : index;
}

/**
 * Название тарифа для интерфейса.
 *
 * Один канонический путь `seller.plans.<id>.title` и для кабинета, и для
 * админки: два словаря одних и тех же четырёх слов разъехались бы на первой
 * правке, и продавец с администратором читали бы разные названия одного тарифа.
 *
 * `t` параметром, а не через хук: функцию зовут и из таблиц админки, где `t`
 * уже взят выше по дереву, и это единственный способ оставить её обычной
 * функцией, а не третьим хуком в строке таблицы.
 */
export function planLabel(
  plan: SubscriptionPlan,
  t: (path: string) => string,
): string {
  const known = (PLAN_ORDER as readonly string[]).includes(plan)
    ? plan
    : "free";
  return t(`seller.plans.${known}.title`);
}

/** Тариф куплен, а не выдан отсутствием подписки. */
export function isPaidPlan(plan: SubscriptionPlan): plan is PaidPlan {
  return plan !== "free";
}

/**
 * Подписка своего магазина: тариф, срок, оба кармана кредитов, лимиты.
 *
 * Канон — `useSellerProducts`: магазин берётся тем же `useSellerShop()`, и
 * второго запроса за ним не будет — ключ у react-query общий.
 *
 * `enabled: Boolean(shop)` здесь не оптимизация, а условие работоспособности.
 * Кабинет обёрнут `RequireRole role={["user", "seller"]}` — в него заходит и
 * покупатель, ещё не создавший магазин, — а ручка объявлена `@SellerOnly()`.
 * Без флага она стреляла бы 403 у каждого такого захода, и меню перерисовывалось
 * бы поверх ошибки, которой неоткуда взяться.
 *
 * `retry: false` по той же причине: отказ здесь — ответ по существу (нет
 * магазина, магазин упразднён), а не сетевая икота. Три повтора только
 * задержали бы отрисовку меню.
 */
export function useSellerSubscription() {
  const { shop, isLoading: shopLoading } = useSellerShop();
  const query = useSellerSubscriptionsControllerState({
    query: { enabled: Boolean(shop), retry: false },
  });

  return {
    shop,
    subscription: query.data,
    isLoading: shopLoading || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
