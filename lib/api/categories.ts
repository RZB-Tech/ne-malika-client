"use client";

import { useMemo } from "react";
import { useCategoriesControllerFindAll } from "@/lib/api/generated/endpoints/categories/categories";
import type { CategoryDto } from "@/lib/api/generated/schemas";
import type { Locale } from "@/lib/i18n/config";

/**
 * Дерево категорий каталога. Меняется вручную и очень редко, поэтому держим его
 * в кэше запросов надолго: оно нужно и форме товара, и фильтрам, и меню.
 */
export function useCategories() {
  const query = useCategoriesControllerFindAll({
    query: {
      select: (raw) => raw as unknown as CategoryDto[],
      staleTime: 60 * 60 * 1000,
      retry: false,
    },
  });

  return { roots: query.data ?? [], isLoading: query.isLoading };
}

/** Плоский поиск по дереву — форма правки знает только id сохранённой категории. */
export function findCategory(
  roots: CategoryDto[],
  id: number | null | undefined,
): { category: CategoryDto; root: CategoryDto } | undefined {
  if (!id) return undefined;
  for (const root of roots) {
    if (root.id === id) return { category: root, root };
    const child = root.children.find((c) => c.id === id);
    if (child) return { category: child, root };
  }
  return undefined;
}

/**
 * Подпись категории для карточки: «Ноутбуки · Игровые». Один лист без корня
 * читается плохо — «Игровые» встречаются и у мышей, и у мониторов.
 */
export function useCategoryLabel(
  id: number | null | undefined,
  locale: Locale,
): string {
  const { roots } = useCategories();
  return useMemo(() => {
    const found = findCategory(roots, id);
    if (!found) return "";
    const { category, root } = found;
    return category.id === root.id
      ? root.name[locale]
      : `${root.name[locale]} · ${category.name[locale]}`;
  }, [roots, id, locale]);
}
