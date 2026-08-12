"use client";

import { Heart, Plus } from "lucide-react";
import { toast } from "sonner";
import { ProductImage } from "@/components/shared/product-image";
import { useT } from "@/components/providers/i18n-provider";
import { useCompare } from "@/lib/compare/use-compare";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";

/**
 * Быстрый набор сравнения из избранного.
 *
 * Второй источник товаров помимо выдачи поиска: там сравнение набирают кнопкой
 * прямо на плитке, а сюда приходят уже с готовым списком отложенного — и
 * возвращаться в каталог за каждой карточкой ради одной кнопки незачем.
 *
 * Показывается, только пока есть что добавить: пустая полоса под таблицей
 * выглядела бы поломкой.
 */
export function AddFromFavorites() {
  const { t } = useT();
  const { items: favorites, isLoading } = useFavorites();
  const { has, toggle, isFull, max } = useCompare();

  const candidates = favorites.filter((item) => !has(item.id));
  if (isLoading || candidates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-dashed border-border p-4">
      <h2 className="flex items-center gap-2 text-sm font-medium">
        <Heart className="size-4 text-primary" />
        {t("compare.fromFavorites")}
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {t("compare.sourcesHint")}
      </p>

      {/* Полосой с прокруткой, а не сеткой: избранного бывает под сотню, и
          столбец из карточек оттеснил бы саму таблицу сравнения вниз. */}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {candidates.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={isFull}
            onClick={() => {
              // Отказ здесь возможен единственной причины — мест больше нет.
              if (!toggle(item)) {
                toast.message(t("compare.limitReached", { count: max }));
              }
            }}
            className="flex w-52 shrink-0 items-center gap-2 rounded-xl border border-border p-2 text-left transition-colors hover:border-primary hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none disabled:opacity-50"
          >
            <ProductImage
              hue={hueFromId(item.id)}
              categorySlug=""
              src={photoUrl(item.photo) ?? undefined}
              alt={item.name}
              className="size-9 shrink-0 rounded-md"
              iconClassName="size-4"
            />
            <span className="line-clamp-2 min-w-0 flex-1 text-xs">
              {item.name}
            </span>
            <Plus className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
