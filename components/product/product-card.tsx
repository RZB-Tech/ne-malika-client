"use client";

import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/shared/product-image";
import { AvailabilityBadge, DiscountBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { discountPercent } from "@/lib/format";
import { getStore, type Product } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useT();
  const store = getStore(product.storeId);
  const discount = discountPercent(product.price, product.oldPrice);

  return (
    <Card className="group relative flex flex-col overflow-hidden p-0 gap-0 transition-shadow hover:shadow-md">
      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative">
          <ProductImage
            hue={product.hue}
            categorySlug={product.categorySlug}
            className="aspect-[4/3] w-full"
            iconClassName="size-16 transition-transform duration-300 group-hover:scale-110"
          />
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {product.isNew && (
              <Badge className="border-transparent bg-primary text-primary-foreground font-medium">
                {t("home.newTitle")}
              </Badge>
            )}
            {discount && <DiscountBadge percent={discount} />}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{product.brand}</span>
            <span className="size-0.5 rounded-full bg-muted-foreground/50" />
            <AvailabilityBadge status={product.availability} className="px-1.5 py-0 text-[11px]" />
          </div>

          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground group-hover:text-primary">
            {product.name}
          </h3>

          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <div>
              <div className="text-lg font-semibold tabular text-foreground">
                {formatPrice(product.price, locale)}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  {t("common.currency")}
                </span>
              </div>
              {product.oldPrice && (
                <div className="text-xs text-muted-foreground line-through tabular">
                  {formatPrice(product.oldPrice, locale)} {t("common.currency")}
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>

      {store && (
        <Link
          href={`/store/${store.slug}`}
          className="flex items-center justify-between border-t border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-muted/50"
        >
          <span className="flex items-center gap-1.5 truncate">
            <span
              className="size-4 shrink-0 rounded-[5px]"
              style={{ background: `oklch(0.6 0.16 ${store.logoHue})` }}
            />
            <span className="truncate font-medium text-foreground/80">{store.name}</span>
          </span>
          <span className="flex shrink-0 items-center gap-0.5">
            <Star className="size-3 fill-warning text-warning" />
            <span className="tabular">{store.rating.toFixed(1)}</span>
            <ArrowUpRight className="ml-0.5 size-3 opacity-0 transition-opacity group-hover:opacity-60" />
          </span>
        </Link>
      )}
    </Card>
  );
}
