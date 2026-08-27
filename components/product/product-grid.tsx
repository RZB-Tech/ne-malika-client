"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ProductCardSkeleton } from "./product-card";

export function ProductGrid({ children, className }: { children: ReactNode; className?: string }) {
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
