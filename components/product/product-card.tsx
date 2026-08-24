"use client";

import Link from "next/link";
import { memo, useEffect, useState } from "react";
import { ProductImage } from "@/components/shared/product-image";
import { ContactSellerButton } from "@/components/product/contact-seller-button";
import { FavoriteButton } from "@/components/product/favorite-button";
import { CompareButton } from "@/components/product/compare-button";
import { AvailabilityBadge } from "@/components/shared/badges";
import { RatingStars } from "@/components/shared/rating-stars";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { productToSnapshot } from "@/lib/product-snapshot";
import { type Product } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

/** Через сколько показывать следующее фото, пока курсор на карточке. */
const PHOTO_INTERVAL_MS = 1000;

/**
 * Перелистывать ли фотографии самостоятельно.
 *
 * Только там, где есть настоящее наведение: на телефоне `onMouseEnter`
 * срабатывает по касанию, и карточка начинала бы мигать под пальцем. И только
 * если человек не просил систему убрать анимацию — движущаяся сама по себе
 * картинка ровно то, от чего эта настройка защищает.
 */
function canAutoplay(): boolean {
  return (
    window.matchMedia("(hover: hover)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Карточка каталога по раскладке маркетплейса: высокая картинка 3:4, а под ней
 * сначала цена и только потом название.
 *
 * Коробки вокруг карточки нет намеренно. Фотографии товаров — инфографика со
 * своим фоном; рамка вокруг неё даёт двойной контур, а на плитке из пяти
 * колонок ещё и съедает ширину. Границу задаёт сама картинка, скруглённая по
 * углам, — так же это устроено у Wildberries и Ozon.
 */
/**
 * Мемоизация не украшение: в гриде до сотни с лишним плиток, и без неё клик
 * по сердцу (или смена локали) перерисовывал каждую целиком. Снапшоты товара
 * стабильны между изменениями данных, поэтому memo реально отсекает каскад.
 */
export const ProductCard = memo(function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useT();
  const snapshot = productToSnapshot(product);

  const photos = product.photoUrls ?? [];
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!hovered || photos.length < 2 || !canAutoplay()) return;

    for (const url of photos.slice(1)) {
      const preload = new Image();
      preload.src = url;
    }

    const id = setInterval(
      () => setActive((i) => (i + 1) % photos.length),
      PHOTO_INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [hovered, photos.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const leave = () => {
    setHovered(false);
    setActive(0);
  };

  return (
    <div
      /**
       * Высота задана жёстко (`--product-card-h`), а не сложена из содержимого:
       * иначе карточка с рейтингом и двухстрочным названием оказывалась выше
       * соседки без них, и ряд шёл ступенькой. Остаток высоты забирает
       * картинка — она единственная, чей размер можно менять безнаказанно.
       *
       * Только с `sm`: на телефоне в ряду две колонки, карточка узкая, и
       * фиксированная высота растянула бы её в столб.
       */
      className="group relative isolate flex flex-col rounded-2xl bg-card p-2 sm:h-[var(--product-card-h)]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={leave}
    >
      <div className="absolute top-2 right-2 z-20 flex flex-col gap-1.5">
        <FavoriteButton product={snapshot} />
        <CompareButton product={snapshot} />
      </div>

      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden rounded-2xl bg-muted sm:min-h-0 sm:flex-1">
          <ProductImage
            hue={product.hue}
            categorySlug={product.categorySlug}
            src={photos[active] ?? product.imageUrl}
            alt={product.name}
            fit="contain"
            className="aspect-[3/4] w-full transition-transform duration-300 group-hover:scale-[1.03] sm:aspect-auto sm:h-full"
            iconClassName="size-16"
          />
          {product.isNew && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
              <Badge className="border-transparent bg-primary font-medium text-primary-foreground">
                {t("home.newTitle")}
              </Badge>
            </div>
          )}
        </div>

        {/* Текст не тянется: свободную высоту в карточке отдаём картинке. */}
        <div className="flex flex-col gap-1 pt-2.5">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="tabular text-base font-bold text-foreground">
              {product.price === null ? (
                t("product.negotiable")
              ) : (
                <>
                  {formatPrice(product.price, locale)}{" "}
                  <span className="text-xs font-medium text-muted-foreground">
                    {t("common.currency")}
                  </span>
                </>
              )}
            </span>
            {product.oldPrice && (
              <span className="tabular text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice, locale)}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="min-w-0 max-w-full truncate font-medium text-foreground/70">
              {product.brand}
            </span>
            <AvailabilityBadge
              status={product.availability}
              className="shrink-0 px-1.5 py-0 text-[11px]"
            />
          </div>

          <h3 className="line-clamp-2 text-sm leading-snug text-muted-foreground group-hover:text-foreground">
            {product.name}
          </h3>

          {(product.ratingCount ?? 0) > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <RatingStars value={product.rating ?? 0} />
              <span className="tabular">{product.ratingCount}</span>
            </div>
          )}
        </div>
      </Link>

      <div className="pt-2.5">
        <ContactSellerButton
          productId={product.id}
          label={t("product.contactShort")}
          className="w-full"
        />
      </div>
    </div>
  );
});

/**
 * Заглушка ровно той же высоты, что и карточка: одна картинка вместо всей
 * карточки заставляла ленту подпрыгивать в момент загрузки — плитка была
 * заметно ниже того, что вставало на её место.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl bg-card p-2 sm:h-[var(--product-card-h)]">
      <Skeleton className="aspect-[3/4] w-full rounded-2xl sm:aspect-auto sm:min-h-0 sm:flex-1" />
      <Skeleton className="mt-2.5 h-5 w-24" />
      <Skeleton className="mt-1 h-4 w-16" />
      <Skeleton className="mt-1 h-4 w-full" />
      <Skeleton className="mt-2.5 h-8 w-full rounded-lg" />
    </div>
  );
}
