"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ProductState } from "@/lib/api/types";

/**
 * default — порядок, который витрина выбирает сама: без запроса товары идут
 * вперемешку, с запросом — по новизне. Явный выбор пользователя это правило
 * отменяет.
 */
export const CATALOG_SORTS = ["default", "newest", "price_asc", "price_desc"] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];

export interface CatalogFilterValues {
  priceMin: number | null;
  priceMax: number | null;
  state: ProductState | null;
}

function parsePrice(raw: string | null): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || null;
  const subParam = searchParams.get("sub");
  const subCategoryId = subParam ? Number(subParam) : null;

  const priceMin = parsePrice(searchParams.get("min"));
  const priceMax = parsePrice(searchParams.get("max"));

  const stateParam = searchParams.get("state");
  const state: ProductState | null =
    stateParam === "new" || stateParam === "old" ? stateParam : null;

  const sortParam = searchParams.get("sort");
  const sort: CatalogSort = CATALOG_SORTS.includes(sortParam as CatalogSort)
    ? (sortParam as CatalogSort)
    : "default";

  const setParams = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  const setCategory = useCallback(
    (slug: string | null) => setParams({ category: slug, sub: null }),
    [setParams],
  );

  const setSubCategory = useCallback(
    (id: number | null) => setParams({ sub: id ? String(id) : null }),
    [setParams],
  );

  const setSort = useCallback(
    (value: CatalogSort) => setParams({ sort: value === "default" ? null : value }),
    [setParams],
  );

  const setFilters = useCallback(
    (values: CatalogFilterValues) =>
      setParams({
        min: values.priceMin === null ? null : String(values.priceMin),
        max: values.priceMax === null ? null : String(values.priceMax),
        state: values.state,
      }),
    [setParams],
  );

  const resetFilters = useCallback(
    () => setParams({ min: null, max: null, state: null }),
    [setParams],
  );

  // Считаем только то, что задал пользователь в панели фильтров: категория
  // и запрос видны на экране сами по себе, дублировать их счётчиком незачем.
  const activeCount =
    (priceMin !== null ? 1 : 0) + (priceMax !== null ? 1 : 0) + (state !== null ? 1 : 0);

  return useMemo(
    () => ({
      q,
      category,
      setCategory,
      subCategoryId,
      setSubCategory,
      priceMin,
      priceMax,
      state,
      sort,
      setSort,
      setFilters,
      resetFilters,
      activeCount,
    }),
    [
      q,
      category,
      setCategory,
      subCategoryId,
      setSubCategory,
      priceMin,
      priceMax,
      state,
      sort,
      setSort,
      setFilters,
      resetFilters,
      activeCount,
    ],
  );
}
