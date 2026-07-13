"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/lib/data";

export function ProductRow({
  title,
  subtitle,
  href,
  linkLabel,
  products,
  tone = "default",
}: {
  title: string;
  subtitle?: string;
  href: string;
  linkLabel: string;
  products: Product[];
  tone?: "default" | "muted";
}) {
  if (!products.length) return null;
  return (
    <section className={tone === "muted" ? "bg-muted/30 border-y border-border" : ""}>
      <div className="mx-auto max-w-[1600px] px-5 py-14 sm:px-8 lg:px-10">
        <SectionHeader
          title={title}
          subtitle={subtitle}
          href={href}
          linkLabel={linkLabel}
          className="mb-7"
        />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
