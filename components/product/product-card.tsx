"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ProductImage } from "@/components/shared/product-image";
import { ContactSellerButton } from "@/components/product/contact-seller-button";
import { FavoriteButton } from "@/components/product/favorite-button";
import { CompareButton } from "@/components/product/compare-button";
import { AvailabilityBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { productToSnapshot } from "@/lib/product-snapshot";
import { type Product } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useT();
  const snapshot = productToSnapshot(product);

  return (
    <Card className="group relative flex flex-col overflow-hidden p-0 gap-0 transition-shadow hover:shadow-md">
      {/* Вне <Link>: это переключатели, а не переход к товару. Поверх картинки
          и с своим z-index, иначе ссылка карточки перехватывает клик. */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-1.5">
        <FavoriteButton product={snapshot} />
        <CompareButton product={snapshot} />
      </div>

      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative">
          <ProductImage
            hue={product.hue}
            categorySlug={product.categorySlug}
            src={product.imageUrl}
            alt={product.name}
            className="aspect-[4/3] w-full"
            iconClassName="size-16 transition-transform duration-300 group-hover:scale-110"
          />
          {product.isNew && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <Badge className="border-transparent bg-primary text-primary-foreground font-medium">
                {t("home.newTitle")}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4 pb-3">
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

      {/* Вне <Link>: кнопка внутри ссылки — вложенная интерактивность, да и
          клик по карточке не должен уводить в Telegram. */}
      <div className="px-4 pb-4">
        <ContactSellerButton productId={product.id} className="w-full" />
      </div>
    </Card>
  );
}
