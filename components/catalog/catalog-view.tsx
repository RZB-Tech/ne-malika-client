"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, SearchX, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/product/product-card";
import { useCatalogFilters } from "./use-catalog-filters";
import type { SortKey } from "./use-catalog-filters";
import { useT } from "@/components/providers/i18n-provider";
import { findCategory, useCategories } from "@/lib/api/categories";
import { openHeaderMenu } from "@/components/layout/header-menu-bus";
import { productCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import type { ProductCardsControllerFindAllParams } from "@/lib/api/generated/schemas";
import { mapPublicProductCard } from "@/lib/api/mappers";
import type { Paginated, PublicProductCard } from "@/lib/api/types";

export type { CatalogFilters, PriceRange, SortKey } from "./use-catalog-filters";

const PAGE_SIZE = 24;

/**
 * Сколько страниц догружается само по скроллу, прежде чем спросить кнопкой.
 * Бесконечная лента без потолка — это и обход всей базы одним долгим скроллом,
 * и тысячи карточек в DOM: вкладка начинает тормозить на ровном месте.
 */
const MAX_AUTO_PAGES = 4;

/** Насколько заранее, не доходя до низа, начинать подгрузку. */
const PRELOAD_MARGIN = "600px 0px";

const SORT_MAP: Record<SortKey, ProductCardsControllerFindAllParams["sort"]> = {
  latest: "newest",
  priceAsc: "price_asc",
  priceDesc: "price_desc",
};

export function CatalogView({
  initialData,
}: {
  // Первая страница каталога, отрендеренная на сервере (SEO). Используется как
  // initialData react-query только когда текущие параметры совпадают с теми, под
  // которые её собрали (page 1, без фильтров, сортировка latest) — иначе
  // гидратация покажет не тот список.
  initialData?: Paginated<PublicProductCard>;
} = {}) {
  const { t, locale } = useT();
  const { roots } = useCategories();

  // Фильтры живут в URL и редактируются из шторки в шапке — здесь их только
  // читают и показывают чипсами.
  const {
    q,
    sort,
    price,
    filters,
    category,
    setCategory,
    subCategoryId,
    setSort,
    clearPrice,
    resetFilters,
  } = useCatalogFilters();

  const params: ProductCardsControllerFindAllParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      q: q || undefined,
      price_min: price.priceMin ?? undefined,
      price_max: price.priceMax ?? undefined,
      // Выбранный лист уже задаёт ветку целиком — раздел в запросе лишний.
      ...(subCategoryId
        ? { category_id: subCategoryId }
        : category
          ? { category }
          : {}),
      sort: SORT_MAP[sort],
    }),
    [q, price, category, subCategoryId, sort],
  );

  // Совпадают ли текущие параметры с серверным первым запросом. Только тогда
  // отданный сервером initialData валиден для этого ключа.
  const isInitialParams =
    !q &&
    price.priceMin == null &&
    price.priceMax == null &&
    !category &&
    sort === "latest";

  const listQuery = useInfiniteQuery({
    // Фильтры в ключе: их смена — это другой кеш, а не дозагрузка к текущему.
    // Лента при этом сбрасывается сама, без ручного reset.
    queryKey: ["/api/v1/product-cards", "infinite", params] as const,
    queryFn: ({ pageParam, signal }) =>
      productCardsControllerFindAll(
        { ...params, page: pageParam },
        undefined,
        signal,
      ) as unknown as Promise<Paginated<PublicProductCard>>,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
    // Главный предохранитель для бэкенда: у infinite-запроса любой refetch
    // перезапрашивает ВСЕ загруженные страницы разом. Без этого возврат на
    // вкладку после десяти подгрузок бил бы десятью запросами сразу.
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    initialData:
      isInitialParams && initialData
        ? { pages: [initialData], pageParams: [1] }
        : undefined,
  });

  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = listQuery;

  const results = useMemo(
    () =>
      (data?.pages ?? []).flatMap((p) => p.data.map(mapPublicProductCard)),
    [data],
  );
  const total = data?.pages[0]?.meta.total ?? 0;

  // Сколько страниц уже подтянулось само. Сбрасывается вместе с фильтрами —
  // приведение состояния во время рендера, чтобы новая выдача не отрисовалась
  // со счётчиком от предыдущей.
  const filterKey = `${q}|${price.priceMin}|${price.priceMax}|${sort}|${category}|${subCategoryId}`;
  const [autoLoads, setAutoLoads] = useState(0);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setAutoLoads(0);
  }

  const canAutoLoad = hasNextPage && autoLoads < MAX_AUTO_PAGES;

  // IntersectionObserver, а не обработчик scroll: браузер сам считает пересечение
  // вне основного потока — на скролле ничего не пересчитывается и не дёргается.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !canAutoLoad || isFetchingNextPage) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        // Одна подгрузка на одно появление: пока страница летит, наблюдатель
        // отключён, иначе дрожание на пиксель слало бы запросы пачками.
        io.disconnect();
        setAutoLoads((n) => n + 1);
        fetchNextPage();
      },
      { rootMargin: PRELOAD_MARGIN },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canAutoLoad, isFetchingNextPage, fetchNextPage]);

  const loadMore = useCallback(() => {
    setAutoLoads(0);
    fetchNextPage();
  }, [fetchNextPage]);

  const title = filters.q ? `“${filters.q}”` : t("catalog.allProducts");

  // В memo держим только данные: обработчик подставляется в JSX по key.
  // Замыкание, читающее ref-ы, во время рендера сюда класть нельзя.
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (filters.priceMin != null || filters.priceMax != null)
      chips.push({
        key: "price",
        label: `${filters.priceMin ?? 0}–${filters.priceMax ?? "∞"} ${t("common.currency")}`,
      });
    if (sort !== "latest")
      chips.push({ key: "sort", label: t(`catalog.sort.${sort}`) });

    // Категорию выбирают в меню шапки, а сбрасывают здесь: иначе фильтр
    // остался бы включённым и никак не показанным.
    const leaf = findCategory(roots, subCategoryId);
    const root = roots.find((r) => r.slug === category);
    const categoryLabel = leaf
      ? `${leaf.root.name[locale]} · ${leaf.category.name[locale]}`
      : (root?.name[locale] ?? null);
    if (categoryLabel) chips.push({ key: "category", label: categoryLabel });

    return chips;
  }, [filters, sort, t, roots, category, subCategoryId, locale]);

  const clearChip = useCallback(
    (key: string) => {
      if (key === "price") return clearPrice();
      // Сброс раздела уносит и подкатегорию — она принадлежала ему.
      if (key === "category") return setCategory(null);
      return setSort("latest");
    },
    [clearPrice, setSort, setCategory],
  );

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular">
          {t("catalog.results", { count: total })}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Сама панель — в шторке слева; здесь только вход в неё и то,
              что уже выбрано. */}
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={openHeaderMenu}
          >
            <SlidersHorizontal className="size-4" />
            {t("catalog.filters")}
          </Button>

          {activeChips.map((c) => (
            <button
              key={c.key}
              onClick={() => clearChip(c.key)}
              className="inline-flex items-center gap-1 rounded-full bg-muted/70 py-1 pl-3 pr-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
            >
              {c.label}
              <X className="size-3 text-muted-foreground" />
            </button>
          ))}
          {activeChips.length > 0 && (
            <button onClick={resetFilters} className="text-xs font-medium text-primary hover:underline">
              {t("common.resetAll")}
            </button>
          )}
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
          <SearchX className="size-10 text-muted-foreground/50" />
          <h3 className="mt-4 font-heading text-lg font-semibold">
            {t("catalog.emptyTitle")}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {t("catalog.loadError")}
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
          <SearchX className="size-10 text-muted-foreground/50" />
          <h3 className="mt-4 font-heading text-lg font-semibold">{t("catalog.emptyTitle")}</h3>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("catalog.emptyText")}</p>
          <Button variant="outline" size="sm" className="mt-5" onClick={resetFilters}>
            {t("common.resetAll")}
          </Button>
        </div>
      ) : (
        <>
          {/* content-visibility: карточки за пределами экрана браузер не
              раскладывает и не рисует. Именно это держит длинную ленту
              отзывчивой, когда в DOM уже несколько сотен товаров.
              contain-intrinsic-size: auto — высота запоминается после первой
              отрисовки, поэтому полоса прокрутки не прыгает. */}
          <div className="grid grid-cols-2 gap-4 [&>*]:[content-visibility:auto] [&>*]:[contain-intrinsic-size:auto_480px] sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {isFetchingNextPage && (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
              {/* Пустой маркер, за которым следит IntersectionObserver. Пока
                  автодогрузка не исчерпана, до кнопки дело не доходит. */}
              <div ref={sentinelRef} aria-hidden className="h-px w-px" />
              {!canAutoLoad && !isFetchingNextPage && (
                <Button variant="outline" onClick={loadMore}>
                  {t("catalog.loadMore")}
                </Button>
              )}
              {isFetchingNextPage && (
                <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("common.loading")}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
