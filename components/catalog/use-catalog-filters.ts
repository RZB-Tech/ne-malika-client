"use client";

import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface CatalogFilters {
  q: string;
  priceMin: number | null;
  priceMax: number | null;
}

export type PriceRange = Pick<CatalogFilters, "priceMin" | "priceMax">;

export type SortKey = "latest" | "priceAsc" | "priceDesc";

export const SORT_KEYS: SortKey[] = ["latest", "priceAsc", "priceDesc"];

const EMPTY: PriceRange = {
  priceMin: null,
  priceMax: null,
};

/** A non-negative number, or null for "not set" — anything else is ignored. */
function readNumber(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * The whole search — text, price bounds, sort — lives in the URL. That keeps it
 * shareable and survives reloads, and it is what gets handed to the API as one
 * request.
 *
 * Смонтирован сразу в двух местах: в каталоге и в шторке шапки (она открывается
 * на любой странице). Копии не общаются напрямую — каждая ведёт свой черновик
 * цены и подхватывает чужие правки через URL.
 *
 * Вызывающий должен находиться под <Suspense>: useSearchParams выводит поддерево
 * из статического рендера.
 */
export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
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
  // За пределами витрины текущий query чужой — начинаем с чистого и уходим на
  // каталог через push, чтобы кнопка «назад» вернула на товар.
  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const onCatalog = pathname === "/";
      const next = new URLSearchParams(onCatalog ? window.location.search : "");
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      const query = next.toString();
      const href = query ? `/?${query}` : "/";
      if (onCatalog) router.replace(href, { scroll: false });
      else router.push(href);
    },
    [router, pathname],
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
  // back button, the other copy of this hook. Our own debounced writes are
  // skipped: the URL catching up to what we already sent must not clobber
  // digits typed since.
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

  const price = useMemo<PriceRange>(
    () => ({ priceMin, priceMax }),
    [priceMin, priceMax],
  );
  const filters = useMemo<CatalogFilters>(() => ({ q, ...price }), [q, price]);

  const setSort = useCallback(
    (s: SortKey) => setParams({ sort: s === "latest" ? null : s }),
    [setParams],
  );

  const clearPrice = useCallback(() => resetPrice(EMPTY), [resetPrice]);

  // Clears the filters, not the text query — the search bar keeps its own copy
  // of `q` and would otherwise show a word it is no longer searching for.
  const resetFilters = useCallback(() => {
    clearTimeout(timerRef.current);
    sentRef.current = EMPTY;
    draftRef.current = EMPTY;
    setPriceDraft(EMPTY);
    setParams({ priceMin: null, priceMax: null, sort: null });
  }, [setParams]);

  // Сколько всего накручено — цифра на бургере в шапке.
  const activeCount =
    (price.priceMin != null || price.priceMax != null ? 1 : 0) +
    (sort === "latest" ? 0 : 1);

  return {
    q,
    sort,
    price,
    filters,
    priceDraft,
    updatePrice,
    setSort,
    clearPrice,
    resetFilters,
    activeCount,
  };
}
