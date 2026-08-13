"use client";

import Link from "next/link";
import { useState } from "react";
import { MapPin, Store as StoreIcon, Truck } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ProductImage } from "@/components/shared/product-image";
import { PhotoLightbox } from "@/components/shared/photo-lightbox";
import { AvailabilityBadge } from "@/components/shared/badges";
import { TelegramButton } from "@/components/product/telegram-button";
import { WriteToSellerButton } from "@/components/chat/write-to-seller-button";
import { FavoriteButton } from "@/components/product/favorite-button";
import { CompareButton } from "@/components/product/compare-button";
import { RevealPhone } from "@/components/product/reveal-phone";
import { ReportDialog } from "@/components/shared/report-dialog";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { RatingStars } from "@/components/shared/rating-stars";
import { Markdown } from "@/components/shared/markdown";
import { ReviewsSection } from "@/components/reviews/reviews-section";
import { useT } from "@/components/providers/i18n-provider";
import { formatWorkSchedule } from "@/lib/api/mappers";
import { formatPrice } from "@/lib/format";
import { productToSnapshot } from "@/lib/product-snapshot";
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
  /** Индекс фото, открытого во весь экран; null — просмотрщик закрыт. */
  const [zoomed, setZoomed] = useState<number | null>(null);
  const snapshot = productToSnapshot(product);

  const photos = product.photoUrls ?? [];
  const gallery =
    photos.length > 0
      ? photos.map((src, i) => ({ src, hue: product.hue + i * 8 }))
      : [product.hue, product.hue + 12, product.hue - 14, product.hue + 26].map(
          (hue) => ({ src: undefined as string | undefined, hue }),
        );

  const hours = formatWorkSchedule(store.workSchedule, t) || store.workingHours;

  const meta = [
    { label: t("product.store"), value: store.name },
    {
      label: t("product.state"),
      value: t(product.isNew ? "product.stateNew" : "product.stateOld"),
    },
  ];

  return (
    <PageContainer className="py-6">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {/**
           * Галерея — вертикальная, как на крупных маркетплейсах: колонка
           * миниатюр слева, крупное фото справа.
           *
           * Ширина ограничена, потому что левая колонка страницы шире, чем
           * нужно фотографии: без потолка вертикальный кадр вытянулся бы на
           * тысячу с лишним пикселей и занял бы экран целиком.
           */}
          <div className="grid max-w-[640px] grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[76px_minmax(0,1fr)]">
            {/* Много фото — колонка прокручивается, а не растёт бесконечно. */}
            <div className="no-scrollbar order-2 flex min-w-0 gap-3 overflow-x-auto pb-1 sm:order-1 sm:max-h-[45rem] sm:flex-col sm:overflow-x-visible sm:overflow-y-auto sm:pb-0">
              {gallery.map((g, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  aria-current={active === i}
                  className={cn(
                    /**
                     * Выбранное фото отмечено рамкой, а не яркостью: соседние
                     * при затемнении читались как выключенные, хотя нажать
                     * можно любое.
                     */
                    "aspect-[3/4] w-[72px] shrink-0 overflow-hidden rounded-lg transition-shadow",
                    active === i
                      ? "ring-2 ring-primary"
                      : "ring-1 ring-border hover:ring-foreground/25",
                  )}
                >
                  <ProductImage
                    hue={g.hue}
                    src={g.src}
                    alt={product.name}
                    categorySlug={product.categorySlug}
                    fit="contain"
                    className="h-full w-full"
                    iconClassName="size-5"
                  />
                </button>
              ))}
            </div>
            <div className="relative order-1 min-w-0 sm:order-2">
              {/**
               * Крупный просмотр — только когда фото настоящее: на заглушке
               * категории увеличивать нечего.
               */}
              <button
                type="button"
                onClick={() => photos.length > 0 && setZoomed(active)}
                aria-label={t("common.zoom")}
                className={cn(
                  "block w-full",
                  photos.length > 0 ? "cursor-zoom-in" : "cursor-default",
                )}
              >
                {/**
                 * Вертикальный кадр 3:4 — в этой же пропорции генерируются
                 * фото товаров (960×1280), поэтому у большинства карточек полей
                 * не будет вовсе.
                 *
                 * Показываем фото целиком, а не заполняем кадр: продавцы грузят
                 * снимки вперемешку, и обрезка съедала бы то подпись на
                 * рекламной картинке, то часть товара.
                 */}
                <ProductImage
                  hue={gallery[active]?.hue ?? product.hue}
                  src={gallery[active]?.src}
                  alt={product.name}
                  categorySlug={product.categorySlug}
                  fit="contain"
                  className="aspect-[3/4] w-full rounded-2xl"
                  iconClassName="size-32"
                />
              </button>
              {product.isNew && (
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                    {t("home.newTitle")}
                  </span>
                </div>
              )}
            </div>
          </div>

          <PhotoLightbox
            photos={photos}
            startIndex={zoomed}
            onClose={() => setZoomed(null)}
            alt={product.name}
          />

          <section className="mt-10">
            <h2 className="font-heading text-xl font-bold tracking-tight">{t("product.description")}</h2>
            <Markdown
              text={product.description}
              className="mt-3 max-w-2xl leading-relaxed text-muted-foreground"
            />
          </section>

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

          <ReviewsSection
            target={{ productId: Number(product.id) }}
            ownerId={store.ownerId}
          />
        </div>

        <div className="lg:self-start">
          <Card className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <AvailabilityBadge status={product.availability} />
            </div>

            <h1 className="font-heading text-xl font-bold leading-snug tracking-tight">
              {product.name}
            </h1>

            {(product.ratingCount ?? 0) > 0 && (
              <div className="mt-2 flex items-center gap-2 text-sm">
                <RatingStars value={product.rating ?? 0} />
                <span className="font-medium tabular">
                  {(product.rating ?? 0).toFixed(1).replace(".", ",")}
                </span>
                <span className="text-muted-foreground">
                  {t("reviews.count", { count: product.ratingCount ?? 0 })}
                </span>
              </div>
            )}

            <div className="mt-4 flex items-end gap-3">
              <span className="font-heading text-3xl font-bold tabular">
                {product.price === null ? (
                  <span className="text-2xl">{t("product.negotiableFull")}</span>
                ) : (
                  <>
                    {formatPrice(product.price, locale)}
                    <span className="ml-1 text-lg font-semibold text-muted-foreground">
                      {t("common.currency")}
                    </span>
                  </>
                )}
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

            <Link href={`/store/${store.slug}`} className="group flex items-center gap-3">
              <StoreAvatar
                name={store.name}
                hue={store.logoHue}
                src={store.photoUrl}
                className="size-11 rounded-xl"
                fallback={<StoreIcon className="size-5" />}
              />
              <span className="min-w-0">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground group-hover:text-primary">
                    {store.name}
                  </span>
                </span>
                {hours && (
                  <span className="text-xs text-muted-foreground">{hours}</span>
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
              <WriteToSellerButton
                productId={Number(product.id)}
                shopId={Number(product.storeId)}
                className="w-full"
              />
              <Button asChild variant="outline" className="gap-2">
                <Link href={`/store/${store.slug}`}>
                  <StoreIcon className="size-4" />
                  {t("product.store")}
                </Link>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <FavoriteButton product={snapshot} variant="full" />
                <CompareButton product={snapshot} variant="full" />
              </div>
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
    </PageContainer>
  );
}
