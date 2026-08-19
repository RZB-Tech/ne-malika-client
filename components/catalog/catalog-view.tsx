"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, SearchX, TriangleAlert, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { StatusPanel } from "@/components/shared/status-panel";
import {
  ProductCard,
  ProductCardSkeleton,
} from "@/components/product/product-card";
import { useCatalogFilters } from "./use-catalog-filters";
import { useT } from "@/components/providers/i18n-provider";
import { findCategory, useCategories } from "@/lib/api/categories";
import { productCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import type { ProductCardsControllerFindAllParams } from "@/lib/api/generated/schemas";
import { mapPublicProductCard } from "@/lib/api/mappers";
import { randomCatalogSeed } from "@/lib/catalog-seed";
import type { Paginated, PublicProductCard } from "@/lib/api/types";

const PAGE_SIZE = 24;

/**
 * Сколько страниц догружается само по скроллу, прежде чем спросить кнопкой.
 * Бесконечная лента без потолка — это и обход всей базы одним долгим скроллом,
 * и тысячи карточек в DOM: вкладка начинает тормозить на ровном месте.
 */
const MAX_AUTO_PAGES = 4;

/** Насколько заранее, не доходя до низа, начинать подгрузку. */
const PRELOAD_MARGIN = "600px 0px";

export function CatalogView({
  initialData,
  seed: initialSeed,
}: {
  initialData?: Paginated<PublicProductCard>;
  /**
   * Зерно перемешивания с сервера — то самое, с которым собран `initialData`.
   * Держим его в состоянии, чтобы оно пережило смену фильтров: иначе выбор
   * раздела тасовал бы витрину заново, хотя покупатель всего лишь сузил её.
   */
  seed?: string;
} = {}) {
  const { t, locale } = useT();
  const { roots } = useCategories();

  const { q, category, setCategory, subCategoryId } = useCatalogFilters();

  const [seed] = useState(() => initialSeed ?? randomCatalogSeed());

  const params: ProductCardsControllerFindAllParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      q: q || undefined,
      ...(subCategoryId
        ? { category_id: subCategoryId }
        : category
          ? { category }
          : {}),
      /**
       * Витрину показываем вперемешку, но поиск — по совпадению: там сверху
       * обязан оказаться товар, у которого совпало название, а не случайный.
       */
      ...(q
        ? { sort: 'newest' as const }
        : { sort: 'random' as const, seed }),
    }),
    [q, category, subCategoryId, seed],
  );

  const isInitialParams = !q && !category && subCategoryId == null;

  const listQuery = useInfiniteQuery({
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
    refetch,
  } = listQuery;

  const results = useMemo(
    () =>
      (data?.pages ?? []).flatMap((p) => p.data.map(mapPublicProductCard)),
    [data],
  );

  const filterKey = `${q}|${category}|${subCategoryId}`;
  const [autoLoads, setAutoLoads] = useState(0);
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setAutoLoads(0);
  }

  const categoryLabel = useMemo(() => {
    const leaf = findCategory(roots, subCategoryId);
    if (leaf) return `${leaf.root.name[locale]} · ${leaf.category.name[locale]}`;
    return roots.find((r) => r.slug === category)?.name[locale] ?? null;
  }, [roots, category, subCategoryId, locale]);

  const canAutoLoad = hasNextPage && autoLoads < MAX_AUTO_PAGES;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !canAutoLoad || isFetchingNextPage) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
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

  return (
    <PageContainer className="py-8">
      {categoryLabel && (
        <div className="mb-4">
          <button
            onClick={() => setCategory(null)}
            className="inline-flex items-center gap-1 rounded-full bg-muted/70 py-1 pl-3 pr-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            {categoryLabel}
            <X className="size-3 text-muted-foreground" />
          </button>
        </div>
      )}

      {isError ? (
        <StatusPanel
          tone="error"
          icon={<TriangleAlert className="size-5" />}
          title={t("catalog.errorTitle")}
          description={t("catalog.loadError")}
          action={
            <Button type="button" variant="outline" onClick={() => void refetch()}>
              <RefreshCw data-icon="inline-start" />
              {t("common.retry")}
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 justify-center gap-3 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,var(--product-card-w))]">
          {Array.from({ length: 10 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : results.length === 0 ? (
        <StatusPanel
          icon={<SearchX className="size-5" />}
          title={t("catalog.emptyTitle")}
          description={t("catalog.emptyText")}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 justify-center gap-3 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,var(--product-card-w))] [&>*]:[content-visibility:auto] [&>*]:[contain-intrinsic-size:auto_428px]">
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {isFetchingNextPage && (
            <div className="mt-4 grid grid-cols-2 justify-center gap-3 md:grid-cols-3 lg:grid-cols-[repeat(auto-fill,var(--product-card-w))]">
              {Array.from({ length: 5 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          )}

          {hasNextPage && (
            <div className="mt-8 flex justify-center">
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
    </PageContainer>
  );
}
