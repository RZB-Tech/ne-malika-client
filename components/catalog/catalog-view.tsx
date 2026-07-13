"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard } from "@/components/product/product-card";
import { FilterPanel } from "./filter-panel";
import { useT } from "@/components/providers/i18n-provider";
import { useProductCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import type { ProductCardsControllerFindAllParams } from "@/lib/api/generated/schemas";
import { mapPublicProductCard } from "@/lib/api/mappers";
import type { Paginated, PublicProductCard } from "@/lib/api/types";

export interface CatalogFilters {
  q: string;
  priceMin: number | null;
  priceMax: number | null;
}

export type SortKey = "latest" | "priceAsc" | "priceDesc";

export const SORT_KEYS: SortKey[] = ["latest", "priceAsc", "priceDesc"];

const EMPTY: PriceRange = {
  priceMin: null,
  priceMax: null,
};

const PAGE_SIZE = 24;

const SORT_MAP: Record<SortKey, ProductCardsControllerFindAllParams["sort"]> = {
  latest: "newest",
  priceAsc: "price_asc",
  priceDesc: "price_desc",
};

export type PriceRange = Pick<CatalogFilters, "priceMin" | "priceMax">;

/** A non-negative number, or null for "not set" — anything else is ignored. */
function readNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function CatalogView() {
  const { t } = useT();
  const router = useRouter();

  // The whole search — text, price bounds, sort — lives in the URL. That keeps
  // it shareable and survives reloads, and it is what gets handed to the API as
  // one request: `q` matches name/description, the bounds narrow it by price.
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const sortParam = searchParams.get("sort");
  const sort = SORT_KEYS.includes(sortParam as SortKey)
    ? (sortParam as SortKey)
    : "latest";
  const priceMin = readNumber(searchParams.get("priceMin"));
  const priceMax = readNumber(searchParams.get("priceMax"));

  // Merges against the live URL rather than a captured render's copy, so a
  // debounced write can never resurrect params that changed while it waited.
  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(window.location.search);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const query = next.toString();
      router.replace(query ? `/?${query}` : "/", { scroll: false });
    },
    [router],
  );

  // The price inputs echo keystrokes locally and commit to the URL once typing
  // settles — otherwise every digit of "1200" would be its own request. The
  // timer lives in a ref: an effect-with-cleanup debounce would be re-armed by
  // every unrelated render and never fire.
  const [priceDraft, setPriceDraft] = useState<PriceRange>({ priceMin, priceMax });
  const draftRef = useRef(priceDraft);
  const sentRef = useRef(priceDraft);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const writePrice = useCallback(
    (next: PriceRange) => {
      sentRef.current = next;
      setParams({
        priceMin: next.priceMin?.toString() ?? null,
        priceMax: next.priceMax?.toString() ?? null,
      });
    },
    [setParams],
  );

  const updatePrice = useCallback<Dispatch<SetStateAction<PriceRange>>>(
    (updater) => {
      const next =
        typeof updater === "function" ? updater(draftRef.current) : updater;
      draftRef.current = next;
      setPriceDraft(next);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => writePrice(next), 400);
    },
    [writePrice],
  );

  const resetPrice = useCallback(
    (next: PriceRange) => {
      clearTimeout(timerRef.current);
      draftRef.current = next;
      setPriceDraft(next);
      writePrice(next);
    },
    [writePrice],
  );

  // Adopt price bounds that changed outside of the inputs — a shared link, the
  // back button. Our own debounced writes are skipped: the URL catching up to
  // what we already sent must not clobber digits typed since.
  useEffect(() => {
    if (priceMin === sentRef.current.priceMin && priceMax === sentRef.current.priceMax)
      return;

    clearTimeout(timerRef.current);
    const next = { priceMin, priceMax };
    sentRef.current = next;
    draftRef.current = next;
    setPriceDraft(next);
  }, [priceMin, priceMax]);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [q, priceMin, priceMax, sort]);

  const price = useMemo<PriceRange>(
    () => ({ priceMin, priceMax }),
    [priceMin, priceMax],
  );
  const filters = useMemo<CatalogFilters>(() => ({ q, ...price }), [q, price]);

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

  const listQuery = useProductCardsControllerFindAll(params, {
    query: {
      select: (raw) => raw as unknown as Paginated<PublicProductCard>,
      placeholderData: (prev) => prev,
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

  const clearPrice = useCallback(() => resetPrice(EMPTY), [resetPrice]);

  // Clears the filters, not the text query — the search bar keeps its own copy
  // of `q` and would otherwise show a word it is no longer searching for.
  const setFiltersReset = useCallback(() => {
    clearTimeout(timerRef.current);
    sentRef.current = EMPTY;
    draftRef.current = EMPTY;
    setPriceDraft(EMPTY);
    setParams({ priceMin: null, priceMax: null, sort: null });
  }, [setParams]);

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (filters.priceMin != null || filters.priceMax != null)
      chips.push({
        key: "price",
        label: `${filters.priceMin ?? 0}–${filters.priceMax ?? "∞"} ${t("common.currency")}`,
        clear: clearPrice,
      });
    return chips;
  }, [filters, t, clearPrice]);

  const panel = (
    <FilterPanel
      filters={priceDraft}
      setFilters={updatePrice}
      sort={sort}
      setSort={(s) => setParams({ sort: s === "latest" ? null : s })}
    />
  );

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular">
          {t("catalog.results", { count: total })}
        </p>

        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {activeChips.map((c) => (
              <button
                key={c.key}
                onClick={c.clear}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-1 pl-3 pr-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {c.label}
                <X className="size-3 text-muted-foreground" />
              </button>
            ))}
            <button onClick={setFiltersReset} className="text-xs font-medium text-primary hover:underline">
              {t("common.resetAll")}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-border p-4 lg:rounded-none lg:border-0 lg:p-0">
            {panel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
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
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[3/4] w-full rounded-2xl" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <SearchX className="size-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-heading text-lg font-semibold">{t("catalog.emptyTitle")}</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("catalog.emptyText")}</p>
              <Button variant="outline" size="sm" className="mt-5" onClick={setFiltersReset}>
                {t("common.resetAll")}
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
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
      </div>
    </div>
  );
}
