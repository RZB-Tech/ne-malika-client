"use client";

import { useMemo, useState } from "react";
import { SearchX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product/product-card";
import { FilterPanel } from "./filter-panel";
import { useT } from "@/components/providers/i18n-provider";
import { publicProducts, type Product } from "@/lib/data";

export interface CatalogFilters {
  q: string;
  priceMin: number | null;
  priceMax: number | null;
}

export type SortKey = "latest" | "oldest" | "priceAsc" | "priceDesc";

export const SORT_KEYS: SortKey[] = ["latest", "oldest", "priceAsc", "priceDesc"];

const EMPTY: CatalogFilters = {
  q: "",
  priceMin: null,
  priceMax: null,
};

function matches(p: Product, f: CatalogFilters): boolean {
  if (f.q) {
    const hay = `${p.name} ${p.brand} ${p.model} ${p.sku}`.toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  if (f.priceMin != null && p.price < f.priceMin) return false;
  if (f.priceMax != null && p.price > f.priceMax) return false;
  return true;
}

export function CatalogView({ initial }: { initial: Partial<CatalogFilters> & { sort?: SortKey } }) {
  const { t } = useT();
  const [filters, setFilters] = useState<CatalogFilters>({ ...EMPTY, ...initial });
  const [sort, setSort] = useState<SortKey>(initial.sort ?? "latest");

  const results = useMemo(() => {
    const list = publicProducts.filter((p) => matches(p, filters));
    const sorted = [...list];
    switch (sort) {
      case "priceAsc": sorted.sort((a, b) => a.price - b.price); break;
      case "priceDesc": sorted.sort((a, b) => b.price - a.price); break;
      case "oldest": sorted.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)); break;
      default: sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
    return sorted;
  }, [filters, sort]);

  const title = filters.q ? `“${filters.q}”` : t("catalog.allProducts");

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (filters.priceMin != null || filters.priceMax != null)
      chips.push({
        key: "price",
        label: `${filters.priceMin ?? 0}–${filters.priceMax ?? "∞"} ${t("common.currency")}`,
        clear: () => setFilters((f) => ({ ...f, priceMin: null, priceMax: null })),
      });
    return chips;
  }, [filters, t]);

  const reset = () => setFilters(EMPTY);

  const panel = (
    <FilterPanel filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground tabular">
          {t("catalog.results", { count: results.length })}
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
            <button onClick={reset} className="text-xs font-medium text-primary hover:underline">
              {t("common.resetAll")}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <div className="rounded-2xl border border-border p-4 lg:sticky lg:top-32 lg:rounded-none lg:border-0 lg:p-0">
            {panel}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
              <SearchX className="size-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-heading text-lg font-semibold">{t("catalog.emptyTitle")}</h3>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("catalog.emptyText")}</p>
              <Button variant="outline" size="sm" className="mt-5" onClick={reset}>
                {t("common.resetAll")}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
