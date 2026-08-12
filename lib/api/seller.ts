"use client";

import { useSellerShopsControllerList } from "./generated/endpoints/shops-seller/shops-seller";
import { useSellerProductCardsControllerList } from "./generated/endpoints/product-cards-seller/product-cards-seller";
import type { ProductCardRow, ShopRow } from "./types";

export function useSellerShop() {
  const query = useSellerShopsControllerList({
    query: { select: (raw) => raw as unknown as ShopRow[] },
  });
  return { shop: query.data?.[0], isLoading: query.isLoading };
}

export function useSellerProducts() {
  const { shop, isLoading: shopLoading } = useSellerShop();
  const query = useSellerProductCardsControllerList(shop?.id ?? 0, {
    query: {
      enabled: Boolean(shop),
      select: (raw) => raw as unknown as ProductCardRow[],
    },
  });

  return {
    shop,
    rows: query.data ?? [],
    isLoading: shopLoading || query.isLoading,
  };
}
