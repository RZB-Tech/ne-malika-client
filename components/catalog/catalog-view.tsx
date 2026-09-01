"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2, RefreshCw, RotateCcw, SearchX, TriangleAlert, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { StatusPanel } from "@/components/shared/status-panel";
import { ProductCard } from "@/components/product/product-card";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/product-grid";
import { CatalogToolbar } from "./catalog-toolbar";
import { useCatalogFilters } from "./use-catalog-filters";
import { useT } from "@/components/providers/i18n-provider";
import { findCategory, useCategories } from "@/lib/api/categories";
import { productCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import type { ProductCardsControllerFindAllParams } from "@/lib/api/generated/schemas";
import { mapPublicProductCard } from "@/lib/api/mappers";
import { randomCatalogSeed } from "@/lib/catalog-seed";
import { visitorId } from "@/lib/analytics";
import type { Paginated, PublicProductCard } from "@/lib/api/types";

const PAGE_SIZE = 24;

const MAX_AUTO_PAGES = 4;

const PRELOAD_MARGIN = "600px 0px";

export function CatalogView({
  initialData,
  seed: initialSeed,
}: {
  initialData?: Paginated<PublicProductCard>;
  seed?: string;
} = {}) {
  const { t, locale } = useT();
  const { roots } = useCategories();

  const {
    q,
    category,
    setCategory,
    subCategoryId,
    priceMin,
    priceMax,
    state,
    sort,
    setSort,
    setFilters,
    resetFilters,
    activeCount,
  } = useCatalogFilters();

  const [seed] = useState(() => initialSeed ?? randomCatalogSeed());

  const params: ProductCardsControllerFindAllParams = useMemo(
    () => ({
      limit: PAGE_SIZE,
      q: q || undefined,
      ...(subCategoryId ? { category_id: subCategoryId } : category ? { category } : {}),
      ...(priceMin === null ? {} : { price_min: priceMin }),
      ...(priceMax === null ? {} : { price_max: priceMax }),
      ...(state ? { state } : {}),
      // Порядок по умолчанию: без запроса — вперемешку с постоянным зерном,
      // с запросом — по новизне. Явный выбор пользователя это правило отменяет.
      ...(sort !== "default"
        ? { sort }
        : q
          ? { sort: "newest" as const }
          : { sort: "random" as const, seed }),
    }),
    [q, category, subCategoryId, priceMin, priceMax, state, sort, seed],
  );

  const isInitialParams =
    !q &&
    !category &&
    subCategoryId == null &&
    priceMin === null &&
    priceMax === null &&
    state === null &&
    sort === "default";

  const listQuery = useInfiniteQuery({
    queryKey: ["/api/v1/product-cards", "infinite", params] as const,
    queryFn: ({ pageParam, signal }) =>
      productCardsControllerFindAll(
        { ...params, page: pageParam, visitor_id: visitorId() ?? undefined },
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
      isInitialParams && initialData ? { pages: [initialData], pageParams: [1] } : undefined,
  });

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    listQuery;

  const results = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.data.map(mapPublicProductCard)),
    [data],
  );

  const filterKey = `${q}|${category}|${subCategoryId}|${priceMin}|${priceMax}|${state}|${sort}`;
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

      <CatalogToolbar
        className="mb-6"
        values={{ priceMin, priceMax, state }}
        sort={sort}
        activeCount={activeCount}
        onApply={setFilters}
        onReset={resetFilters}
        onSortChange={setSort}
      />

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
        <ProductGridSkeleton count={10} />
      ) : results.length === 0 ? (
        <StatusPanel
          icon={<SearchX className="size-5" />}
          title={t("catalog.emptyTitle")}
          description={t("catalog.emptyText")}
          action={
            activeCount > 0 ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                <RotateCcw data-icon="inline-start" />
                {t("common.resetAll")}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ProductGrid>
            {results.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </ProductGrid>

          {isFetchingNextPage && <ProductGridSkeleton count={5} className="mt-4" />}

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
