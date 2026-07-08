"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronRight,
  Eye,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Store as StoreIcon,
  Truck,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/shared/product-image";
import { AvailabilityBadge } from "@/components/shared/badges";
import { ProductCard } from "@/components/product/product-card";
import { TelegramButton } from "@/components/product/telegram-button";
import { RevealPhone } from "@/components/product/reveal-phone";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice, formatNumber } from "@/lib/format";
import {
  getCategory,
  getStore,
  publicProducts,
  type Product,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export function ProductDetail({ product }: { product: Product }) {
  const { t, locale } = useT();
  const store = getStore(product.storeId)!;
  const category = getCategory(product.categorySlug);
  const [active, setActive] = useState(0);

  // Simulated multi-angle gallery from the deterministic tile.
  const gallery = [product.hue, product.hue + 12, product.hue - 14, product.hue + 26];

  const similar = publicProducts
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id)
    .slice(0, 5);

  const meta = [
    { label: t("product.brand"), value: product.brand },
    { label: t("product.model"), value: product.model },
    { label: t("product.sku"), value: product.sku },
    { label: t("product.warranty"), value: t("product.warrantyMonths", { count: product.warrantyMonths }) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      {/* breadcrumb */}
      <nav className="mb-5 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{t("brand.name")}</Link>
        {category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link href="/" className="hover:text-foreground">
              {category.name[locale]}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground/70">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* left: gallery + details */}
        <div className="min-w-0">
          <div className="grid gap-4 sm:grid-cols-[76px_1fr]">
            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
              {gallery.map((hue, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "overflow-hidden rounded-lg border-2 transition-colors",
                    active === i ? "border-primary" : "border-border hover:border-primary/40",
                  )}
                >
                  <ProductImage
                    hue={hue}
                    categorySlug={product.categorySlug}
                    className="size-16"
                    iconClassName="size-6"
                  />
                </button>
              ))}
            </div>
            <div className="relative order-1 sm:order-2">
              <ProductImage
                hue={gallery[active]}
                categorySlug={product.categorySlug}
                className="aspect-[4/3] w-full rounded-2xl border border-border"
                iconClassName="size-32"
              />
              {product.isNew && (
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    {t("home.newTitle")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* description */}
          <section className="mt-10">
            <h2 className="font-heading text-xl font-bold tracking-tight">{t("product.description")}</h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">{product.description}</p>
          </section>

          {/* specs */}
          <section className="mt-10">
            <h2 className="font-heading text-xl font-bold tracking-tight">{t("product.specs")}</h2>
            <dl className="mt-4 max-w-2xl overflow-hidden rounded-xl border border-border">
              {product.specs.map((s, i) => (
                <div
                  key={s.name}
                  className={cn(
                    "grid grid-cols-2 gap-4 px-4 py-3 text-sm",
                    i % 2 === 0 ? "bg-muted/40" : "bg-transparent",
                  )}
                >
                  <dt className="text-muted-foreground">{s.name}</dt>
                  <dd className="font-medium text-foreground">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>

        {/* right: sticky buy panel */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <AvailabilityBadge status={product.availability} />
              <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Eye className="size-3.5" />
                <span className="tabular">{formatNumber(product.views, locale)}</span>
              </span>
            </div>

            <h1 className="font-heading text-xl font-bold leading-snug tracking-tight">
              {product.name}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              <span className="font-heading text-3xl font-bold tabular">
                {formatPrice(product.price, locale)}
                <span className="ml-1 text-lg font-semibold text-muted-foreground">{t("common.currency")}</span>
              </span>
              {product.oldPrice && (
                <span className="pb-1 text-sm text-muted-foreground line-through tabular">
                  {formatPrice(product.oldPrice, locale)} {t("common.currency")}
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              {meta.map((m) => (
                <div key={m.label} className="rounded-lg bg-muted/50 px-3 py-2">
                  <div className="text-muted-foreground">{m.label}</div>
                  <div className="mt-0.5 font-medium text-foreground">{m.value}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-success" />
              {t("product.warranty")}: {t("product.warrantyMonths", { count: product.warrantyMonths })}
            </div>

            <Separator className="my-5" />

            {/* seller */}
            <Link href={`/store/${store.slug}`} className="group flex items-center gap-3">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-xl text-white"
                style={{ background: `oklch(0.55 0.17 ${store.logoHue})` }}
              >
                <StoreIcon className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground group-hover:text-primary">
                    {store.name}
                  </span>
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="size-3 fill-warning text-warning" />
                  <span className="tabular">{store.rating.toFixed(1)}</span>
                  <span>· {store.ratingCount}</span>
                </span>
              </span>
            </Link>

            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {store.address}
              </div>
              <RevealPhone phone={store.phone} productId={product.id} />
            </div>

            <div className="mt-5 grid gap-2">
              <TelegramButton
                username={store.telegram}
                productName={product.name}
                productId={product.id}
                label={t("product.openTelegram")}
                className="w-full"
              />
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="gap-2">
                  <a href={`tel:${store.phone.replace(/\s/g, "")}`}>
                    <Phone className="size-4" />
                    {t("product.callSeller")}
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href={`/store/${store.slug}`}>
                    <StoreIcon className="size-4" />
                    {t("product.store")}
                  </Link>
                </Button>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <Truck className="size-4 shrink-0 text-primary" />
              {t("footer.disclaimer")}
            </div>
          </Card>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight">{t("product.similar")}</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {similar.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
