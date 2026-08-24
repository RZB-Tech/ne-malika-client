"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProductCardSkeleton } from "./product-card";

/**
 * Единая сетка карточек товара: 2 колонки на телефоне, 3 на планшете, дальше
 * авто-заполнение по ширине контейнера. Раньше этот класс копировался в девяти
 * местах, и оптимизационные content-visibility классы доехали только в один
 * из копий — остальные рендерили плитки за пределами вьюпента целиком.
 */
export function ProductGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 justify-center gap-3 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,var(--product-card-w))]",
        "[&>*]:[content-visibility:auto] [&>*]:[contain-intrinsic-size:auto_428px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Скелет сетки на время загрузки — той же высоты, что настоящие карточки. */
export function ProductGridSkeleton({
  count = 10,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <ProductGrid className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </ProductGrid>
  );
}
