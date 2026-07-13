"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Store as StoreIcon, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/shared/product-image";
import { AvailabilityBadge } from "@/components/shared/badges";
import { TelegramButton } from "@/components/product/telegram-button";
import { RevealPhone } from "@/components/product/reveal-phone";
import { ReportDialog } from "@/components/shared/report-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { type Product, type Store } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ProductDetail({
  product,
  store,
}: {
  product: Product;
  store: Store;
}) {
  const { t, locale } = useT();
  const [active, setActive] = useState(0);

  // Prefer real photos; fall back to deterministic tinted tiles.
  const photos = product.photoUrls ?? [];
  const gallery =
    photos.length > 0
      ? photos.map((src, i) => ({ src, hue: product.hue + i * 8 }))
      : [product.hue, product.hue + 12, product.hue - 14, product.hue + 26].map(
          (hue) => ({ src: undefined as string | undefined, hue }),
        );

  const meta = [
    { label: t("product.store"), value: store.name },
    {
      label: "Состояние",
      value: product.isNew ? "Новый" : "Б/у",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6 sm:px-8 lg:px-10">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* left: gallery + details */}
        <div className="min-w-0">
          {/* Ограничена по ширине: в широкой колонке 4:3 фото иначе разъезжается
              на всю строку. */}
          <div className="grid max-w-4xl gap-4 sm:grid-cols-[76px_1fr]">
            <div className="order-2 flex gap-3 sm:order-1 sm:flex-col">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={cn(
                    "aspect-[5/4] w-[72px] shrink-0 overflow-hidden rounded-lg transition-opacity",
                    active === i ? "opacity-100" : "opacity-55 hover:opacity-85",
                  )}
                >
                  <ProductImage
                    hue={g.hue}
                    src={g.src}
                    alt={product.name}
                    categorySlug={product.categorySlug}
                    className="h-full w-full"
                    iconClassName="size-5"
                  />
                </button>
              ))}
            </div>
            <div className="relative order-1 sm:order-2">
              <ProductImage
                hue={gallery[active]?.hue ?? product.hue}
                src={gallery[active]?.src}
                alt={product.name}
                categorySlug={product.categorySlug}
                className="aspect-[4/3] w-full rounded-2xl"
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
          {product.specs.length > 0 && (
            <section className="mt-10">
              <h2 className="font-heading text-xl font-bold tracking-tight">{t("product.specs")}</h2>
              <dl className="mt-4 max-w-2xl overflow-hidden rounded-xl border border-border">
                {product.specs.map((s, i) => (
                  <div
                    key={`${s.name}-${i}`}
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
          )}
        </div>

        {/* right: buy panel */}
        <div className="lg:self-start">
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <AvailabilityBadge status={product.availability} />
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
                {store.workingHours && (
                  <span className="text-xs text-muted-foreground">
                    {store.workingHours}
                  </span>
                )}
              </span>
            </Link>

            <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
              {store.address && (
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" />
                  {store.address}
                </div>
              )}
              {store.phone && (
                <RevealPhone phone={store.phone} productId={product.id} />
              )}
            </div>

            <div className="mt-5 grid gap-2">
              {store.telegram && (
                <TelegramButton
                  username={store.telegram}
                  productName={product.name}
                  productId={product.id}
                  label={t("product.openTelegram")}
                  className="w-full"
                />
              )}
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/store/${store.slug}`}>
                  <StoreIcon className="size-4" />
                  {t("product.store")}
                </Link>
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
              <Truck className="size-4 shrink-0 text-primary" />
              {t("footer.disclaimer")}
            </div>

            <div className="mt-2 flex justify-center">
              <ReportDialog
                shopId={Number(product.storeId)}
                productCardId={Number(product.id)}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
