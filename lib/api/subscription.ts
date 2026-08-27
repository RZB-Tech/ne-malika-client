"use client";

import { useSellerSubscriptionsControllerState } from "./generated/endpoints/subscriptions-seller/subscriptions-seller";
import { useSellerShop } from "./seller";
import type { PaidPlan, SubscriptionPlan } from "./types";

export const PLAN_ORDER = ["free", "start", "pro", "max"] as const;

export const PAID_PLANS = ["start", "pro", "max"] as const;

export function planRank(plan: SubscriptionPlan): number {
  const index = PLAN_ORDER.indexOf(plan as (typeof PLAN_ORDER)[number]);
  return index < 0 ? 0 : index;
}

export function planLabel(plan: SubscriptionPlan, t: (path: string) => string): string {
  const known = (PLAN_ORDER as readonly string[]).includes(plan) ? plan : "free";
  return t(`seller.plans.${known}.title`);
}

export function isPaidPlan(plan: SubscriptionPlan): plan is PaidPlan {
  return plan !== "free";
}

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
