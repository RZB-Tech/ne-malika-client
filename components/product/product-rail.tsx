"use client";

import { ProductCard } from "@/components/product/product-card";
import { useT } from "@/components/providers/i18n-provider";
import type { Product } from "@/lib/data";

/**
 * Лента похожих товаров: карточки прокручиваются вбок, а не переносятся сеткой —
 * блок стоит под основным содержимым и не должен растягивать страницу на экран.
 */
export function ProductRail({ titleKey, products }: { titleKey: string; products: Product[] }) {
  const { t } = useT();

  if (products.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="font-heading text-xl font-bold tracking-tight">{t(titleKey)}</h2>

      <ul className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {products.map((product) => (
          <li
            key={product.id}
            className="w-[calc(50%-0.375rem)] shrink-0 snap-start sm:w-[var(--product-card-w)]"
          >
            <ProductCard product={product} />
          </li>
        ))}
      </ul>
    </section>
  );
}
