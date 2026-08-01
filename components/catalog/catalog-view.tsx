"use client";

import { useCallback, useMemo, useState } from "react";
import { SearchX, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/product-card";
import { useCatalogFilters } from "./use-catalog-filters";
import type { SortKey } from "./use-catalog-filters";
import { useT } from "@/components/providers/i18n-provider";
import { openHeaderMenu } from "@/components/layout/header-menu-bus";
import { useProductCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import type { ProductCardsControllerFindAllParams } from "@/lib/api/generated/schemas";
import { mapPublicProductCard } from "@/lib/api/mappers";
import type { Paginated, PublicProductCard } from "@/lib/api/types";

export type { CatalogFilters, PriceRange, SortKey } from "./use-catalog-filters";

const PAGE_SIZE = 24;

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
  const { t } = useT();

  // Фильтры живут в URL и редактируются из шторки в шапке — здесь их только
  // читают и показывают чипсами.
  const { q, sort, price, filters, setSort, clearPrice, resetFilters } =
    useCatalogFilters();

  // Сброс страницы при смене фильтров — приведение состояния во время
  // рендера вместо setState в эффекте: новая страница не успевает
  // отрисоваться со старым page.
  const [page, setPage] = useState(1);
  const filterKey = `${q}|${price.priceMin}|${price.priceMax}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const params: ProductCardsControllerFindAllParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      q: q || undefined,
      price_min: price.priceMin ?? undefined,
      price_max: price.priceMax ?? undefined,
      sort: SORT_MAP[sort],
    }),
    [q, price, sort, page],
  );

  // Совпадают ли текущие параметры с серверным первым запросом. Только тогда
  // отданный сервером initialData валиден для этого ключа.
  const isInitialParams =
    page === 1 &&
    !q &&
    price.priceMin == null &&
    price.priceMax == null &&
    sort === "latest";

  const listQuery = useProductCardsControllerFindAll(params, {
    query: {
      select: (raw) => raw as unknown as Paginated<PublicProductCard>,
      placeholderData: (prev) => prev,
      initialData:
        isInitialParams && initialData
          ? (initialData as unknown as void)
          : undefined,
    },
  });

  const data = listQuery.data as Paginated<PublicProductCard> | undefined;
  const isLoading = listQuery.isLoading;
  const isError = listQuery.isError;
  const isFetching = listQuery.isFetching;

  const results = useMemo(
    () => (data?.data ?? []).map(mapPublicProductCard),
    [data],
  );
  const total = data?.meta.total ?? 0;
  const totalPages = data?.meta.totalPages ?? 1;

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
    return chips;
  }, [filters, sort, t]);

  const clearChip = useCallback(
    (key: string) => (key === "price" ? clearPrice() : setSort("latest")),
    [clearPrice, setSort],
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
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
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
            Не удалось загрузить товары. Проверьте, что бэкенд запущен.
          </p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Назад
              </Button>
              <span className="text-sm text-muted-foreground tabular">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Вперёд
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
