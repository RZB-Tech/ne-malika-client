"use client";

import { notFound } from "next/navigation";
import { StoreDetail } from "@/components/store/store-detail";
import { Skeleton } from "@/components/ui/skeleton";
import { useShopsControllerGetPublic } from "@/lib/api/generated/endpoints/shops-public/shops-public";
import { mapProductRow, mapShop } from "@/lib/api/mappers";
import type { PublicShop } from "@/lib/api/types";

export function StoreDetailConnected({ id }: { id: number }) {
  const { data, isLoading, isError } = useShopsControllerGetPublic(id, {
    query: {
      select: (raw) => raw as unknown as PublicShop,
      retry: false,
    },
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !data) {
    notFound();
  }

  const store = mapShop(data);
  const products = (data.productCards ?? []).map((pc) =>
    mapProductRow(pc, data.name),
  );

  return <StoreDetail store={store} products={products} />;
}
