"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Check,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  TriangleAlert,
  X,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { PageContainer } from "@/components/layout/page-container";
import { StatusPanel } from "@/components/shared/status-panel";
import { StoreCard } from "@/components/store/store-card";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { shopsControllerFindAll } from "@/lib/api/generated/endpoints/shops-public/shops-public";
import {
  ShopsControllerFindAllSort,
  type PaginatedPublicShopsDto,
} from "@/lib/api/generated/schemas";

const PAGE_SIZE = 24;

const SORTS = Object.values(ShopsControllerFindAllSort);

const SORT_LABEL: Record<ShopsControllerFindAllSort, string> = {
  products: "stores.sort.products",
  rating: "stores.sort.rating",
  newest: "stores.sort.newest",
  name: "stores.sort.name",
};

const DEBOUNCE_MS = 300;

function isSort(value: string | null): value is ShopsControllerFindAllSort {
  return value !== null && (SORTS as string[]).includes(value);
}

export function StoresView({ initialData }: { initialData?: PaginatedPublicShopsDto }) {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";
  const sortParam = searchParams.get("sort");
  const sort: ShopsControllerFindAllSort = isSort(sortParam) ? sortParam : "products";

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Поле ввода живёт своей жизнью, в адрес запрос уходит с задержкой —
  // иначе каждый символ переписывал бы историю и дёргал API.
  const [draft, setDraft] = useState(q);
  const [syncedQuery, setSyncedQuery] = useState(q);
  if (q !== syncedQuery) {
    setSyncedQuery(q);
    if (q !== draft.trim()) setDraft(q);
  }

  useEffect(() => {
    if (draft.trim() === q) return;
    const id = setTimeout(() => setParams({ q: draft.trim() || null }), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [draft, q, setParams]);

  const params = useMemo(() => ({ limit: PAGE_SIZE, sort, ...(q ? { q } : {}) }), [q, sort]);

  const isInitialParams = !q && sort === "products";

  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["/api/v1/shops", "infinite", params] as const,
      queryFn: ({ pageParam, signal }) =>
        shopsControllerFindAll({ ...params, page: pageParam }, undefined, signal),
      initialPageParam: 1,
      getNextPageParam: (last) =>
        last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
      staleTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      initialData:
        isInitialParams && initialData ? { pages: [initialData], pageParams: [1] } : undefined,
    });

  const shops = useMemo(() => (data?.pages ?? []).flatMap((p) => p.data), [data]);
  const total = data?.pages[0]?.meta.total ?? 0;

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasNextPage || isFetchingNextPage) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <PageContainer className="py-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {t("stores.title")}
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground sm:text-base">
        {t("stores.subtitle")}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pl-9"
            aria-label={t("common.search")}
            placeholder={t("stores.searchPlaceholder")}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          {draft && (
            <button
              type="button"
              aria-label={t("common.clear")}
              onClick={() => setDraft("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <ArrowUpDown data-icon="inline-start" />
              {t(SORT_LABEL[sort])}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORTS.map((option) => (
              <DropdownMenuItem
                key={option}
                onSelect={() => setParams({ sort: option === "products" ? null : option })}
              >
                <Check className={cn("size-4", option === sort ? "opacity-100" : "opacity-0")} />
                {t(SORT_LABEL[option])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {!isLoading && !isError && total > 0 && (
          <span className="text-sm text-muted-foreground tabular">
            {t("common.total", { count: total })}
          </span>
        )}
      </div>

      <div className="mt-6">
        {isError ? (
          <StatusPanel
            tone="error"
            icon={<TriangleAlert className="size-5" />}
            title={t("stores.errorTitle")}
            description={t("stores.loadError")}
            action={
              <Button type="button" variant="outline" onClick={() => void refetch()}>
                <RefreshCw data-icon="inline-start" />
                {t("common.retry")}
              </Button>
            }
          />
        ) : isLoading ? (
          <StoresGridSkeleton />
        ) : shops.length === 0 ? (
          <StatusPanel
            icon={<SearchX className="size-5" />}
            title={t("stores.emptyTitle")}
            description={t("stores.emptyText")}
          />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop) => (
                <StoreCard key={shop.id} shop={shop} />
              ))}
            </div>

            {hasNextPage && (
              <div className="mt-8 flex justify-center">
                <div ref={sentinelRef} aria-hidden className="h-px w-px" />
                {isFetchingNextPage ? (
                  <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    {t("common.loading")}
                  </span>
                ) : (
                  <Button variant="outline" onClick={() => void fetchNextPage()}>
                    {t("catalog.loadMore")}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}

function StoresGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-40 w-full rounded-2xl" />
      ))}
    </div>
  );
}
