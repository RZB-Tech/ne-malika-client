"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Package, PlusCircle, Store, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/shared/stat-card";
import { ProductImage } from "@/components/shared/product-image";
import { ModerationBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { useSellerShopsControllerList } from "@/lib/api/generated/endpoints/shops-seller/shops-seller";
import { useSellerProductCardsControllerList } from "@/lib/api/generated/endpoints/product-cards-seller/product-cards-seller";
import { mapProductRow } from "@/lib/api/mappers";
import type { ProductCardRow, ShopRow } from "@/lib/api/types";

export default function SellerDashboard() {
  const { t, locale } = useT();

  const shopsQuery = useSellerShopsControllerList({
    query: { select: (raw) => raw as unknown as ShopRow[] },
  });
  const shop = shopsQuery.data?.[0];

  const productsQuery = useSellerProductCardsControllerList(shop?.id ?? 0, {
    query: {
      enabled: Boolean(shop),
      select: (raw) => raw as unknown as ProductCardRow[],
    },
  });

  const rows = useMemo(
    () => (productsQuery.data ?? []).map((r) => mapProductRow(r, shop?.name)),
    [productsQuery.data, shop?.name],
  );

  const total = rows.length;
  const active = rows.filter((p) => p.moderation === "published").length;
  const newCount = rows.filter((p) => p.isNew).length;
  const recent = rows.slice(0, 6);

  if (shopsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <Card className="flex flex-col items-center gap-4 py-16 text-center">
        <Store className="size-10 text-muted-foreground/50" />
        <div>
          <h2 className="font-heading text-lg font-semibold">У вас ещё нет магазина</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Создайте магазин, чтобы начать публиковать товары.
          </p>
        </div>
        <Button asChild>
          <Link href="/seller/profile">Создать магазин</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{shop.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("seller.nav.dashboard")}
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/seller/products/new">
            <PlusCircle className="size-4" />
            {t("seller.products.addNew")}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("seller.nav.products")} value={String(total)} icon={Package} />
        <StatCard label="Опубликовано" value={String(active)} icon={Tag} />
        <StatCard label="Новых" value={String(newCount)} icon={Store} />
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold tracking-tight">{t("seller.nav.products")}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/seller/products">Все товары</Link>
          </Button>
        </div>

        {productsQuery.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <Card className="py-12 text-center text-sm text-muted-foreground">
            {t("seller.products.empty")}
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => (
              <Link key={p.id} href={`/seller/products/${p.id}`} className="group">
                {/* flex-row обязателен: у Card в базовых классах flex-col, и один лишь
                    `flex` его не перебивает — карточка складывается в столбик. */}
                <Card className="h-full flex-row items-center gap-3 p-3 transition-colors group-hover:ring-primary/40">
                  <ProductImage
                    hue={p.hue}
                    categorySlug={p.categorySlug}
                    src={p.imageUrl}
                    alt={p.name}
                    className="size-16 shrink-0 rounded-lg"
                    iconClassName="size-5"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="line-clamp-1 text-sm font-medium group-hover:text-primary">
                      {p.name}
                    </div>
                    <div className="truncate text-sm font-semibold tabular">
                      {formatPrice(p.price, locale)} {t("common.currency")}
                    </div>
                    <ModerationBadge status={p.moderation} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
