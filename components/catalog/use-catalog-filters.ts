"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useCatalogFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category")?.trim() || null;
  const subParam = searchParams.get("sub");
  const subCategoryId = subParam ? Number(subParam) : null;

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

  return useMemo(
    () => ({
      q,
      category,
      setCategory,
      subCategoryId,
      setSubCategory,
    }),
    [q, category, setCategory, subCategoryId, setSubCategory],
  );
}
