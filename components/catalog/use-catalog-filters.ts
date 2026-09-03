"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * default — порядок, который витрина выбирает сама: без запроса товары идут
 * вперемешку, с запросом — по новизне. Явный выбор пользователя это правило
 * отменяет.
 */
export const CATALOG_SORTS = ["default", "newest", "price_asc", "price_desc"] as const;

export type CatalogSort = (typeof CATALOG_SORTS)[number];

export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || null;
  const subParam = searchParams.get("sub");
  const subCategoryId = subParam ? Number(subParam) : null;

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

  return useMemo(
    () => ({
      q,
      category,
      setCategory,
      subCategoryId,
      setSubCategory,
      sort,
      setSort,
    }),
    [q, category, setCategory, subCategoryId, setSubCategory, sort, setSort],
  );
}
