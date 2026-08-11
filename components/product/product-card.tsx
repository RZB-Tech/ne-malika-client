"use client";

import Link from "next/link";
import { ProductImage } from "@/components/shared/product-image";
import { ContactSellerButton } from "@/components/product/contact-seller-button";
import { FavoriteButton } from "@/components/product/favorite-button";
import { CompareButton } from "@/components/product/compare-button";
import { AvailabilityBadge } from "@/components/shared/badges";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { productToSnapshot } from "@/lib/product-snapshot";
import { type Product } from "@/lib/data";
import { Badge } from "@/components/ui/badge";

/**
 * Карточка каталога по раскладке маркетплейса: высокая картинка 3:4, а под ней
 * сначала цена и только потом название.
 *
 * Коробки вокруг карточки нет намеренно. Фотографии товаров — инфографика со
 * своим фоном; рамка вокруг неё даёт двойной контур, а на плитке из пяти
 * колонок ещё и съедает ширину. Границу задаёт сама картинка, скруглённая по
 * углам, — так же это устроено у Wildberries и Ozon.
 */
export function ProductCard({ product }: { product: Product }) {
  const { t, locale } = useT();
  const snapshot = productToSnapshot(product);

  return (
    <div className="group relative flex flex-col">
      {/* Вне <Link>: это переключатели, а не переход к товару. Поверх картинки
          и со своим z-index, иначе ссылка карточки перехватывает клик. */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
        <FavoriteButton product={snapshot} />
        <CompareButton product={snapshot} />
      </div>

      <Link href={`/product/${product.id}`} className="flex flex-1 flex-col">
        <div className="relative overflow-hidden rounded-2xl bg-muted">
          {/* contain, а не cover: карточки товаров у продавцов — инфографика с
              надписями, и обрезка по высокой рамке съедала название бренда
              («Canon PIXMA» превращался в «anon IXMA»). Вертикальные картинки
              заполняют кадр целиком, горизонтальные ложатся с полями. */}
          <ProductImage
            hue={product.hue}
            categorySlug={product.categorySlug}
            src={product.imageUrl}
            alt={product.name}
            fit="contain"
            className="aspect-[3/4] w-full transition-transform duration-300 group-hover:scale-[1.03]"
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

        <div className="flex flex-1 flex-col gap-1 pt-2.5">
          {/* Цена первой строкой и самым крупным кеглем: на плитке из пяти
              колонок покупатель сравнивает именно её, а не названия. */}
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="tabular text-base font-bold text-foreground">
              {formatPrice(product.price, locale)}{" "}
              <span className="text-xs font-medium text-muted-foreground">
                {t("common.currency")}
              </span>
            </span>
            {product.oldPrice && (
              <span className="tabular text-xs text-muted-foreground line-through">
                {formatPrice(product.oldPrice, locale)}
              </span>
            )}
          </div>

          {/* Переносится, а не ужимается: в узкой карточке на телефоне бейдж
              съедал половину строки, и от названия магазина оставалось «Те…». */}
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
        </div>
      </Link>

      {/* Вне <Link>: кнопка внутри ссылки — вложенная интерактивность, да и
          клик по карточке не должен уводить в Telegram. */}
      <div className="pt-2.5">
        <ContactSellerButton
          productId={product.id}
          label={t("product.contactShort")}
          className="w-full"
        />
      </div>
    </div>
  );
}

/**
 * Заглушка ровно той же высоты, что и карточка: одна картинка вместо всей
 * карточки заставляла ленту подпрыгивать в момент загрузки — плитка была
 * заметно ниже того, что вставало на её место.
 */
export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col">
      <Skeleton className="aspect-[3/4] w-full rounded-2xl" />
      <Skeleton className="mt-2.5 h-5 w-24" />
      <Skeleton className="mt-1 h-4 w-16" />
      <Skeleton className="mt-1 h-4 w-full" />
      <Skeleton className="mt-2.5 h-8 w-full rounded-lg" />
    </div>
  );
}
