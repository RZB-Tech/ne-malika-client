"use client";

import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useProductCardsControllerGetPublic } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { useShopsControllerGetPublic } from "@/lib/api/generated/endpoints/shops-public/shops-public";
import { mapPublicProductCard, mapShop } from "@/lib/api/mappers";
import type { Product, Store } from "@/lib/data";
import type { PublicProductCard, PublicShop } from "@/lib/api/types";

export function ProductDetailConnected({ id }: { id: number }) {
  const productQuery = useProductCardsControllerGetPublic(id, {
    query: {
      select: (raw) => raw as unknown as PublicProductCard,
      retry: false,
    },
  });

  const shopId = productQuery.data?.shopId;

  const shopQuery = useShopsControllerGetPublic(shopId ?? 0, {
    query: {
      enabled: Boolean(shopId),
      select: (raw) => raw as unknown as PublicShop,
    },
  });

  if (productQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (productQuery.isError || !productQuery.data) {
    notFound();
  }

  const product: Product = mapPublicProductCard(productQuery.data);

  const shop: PublicShop | undefined = shopQuery.data;
  const store: Store = shop
    ? mapShop(shop)
    : {
        // Minimal placeholder until the shop loads (or if it is unavailable).
        id: String(product.storeId),
        slug: String(product.storeId),
        name: product.brand || "Магазин",
        logoHue: product.hue,
        description: "",
        address: "",
        city: "",
        phone: "",
        telegram: "",
        workingHours: "",
        rating: 0,
        ratingCount: 0,
        joined: product.createdAt,
        status: "active",
        storeViews: 0,
      };

  return <ProductDetail product={product} store={store} />;
}
