"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/product/product-card";
import { FilterPanel } from "./filter-panel";
import { useT } from "@/components/providers/i18n-provider";
import {
  publicProducts,
  getCategory,
  getStore,
  type Availability,
  type Product,
} from "@/lib/data";
import { SearchX } from "lucide-react";

export interface CatalogFilters {
  q: string;
  category: string | null;
  subcategory: string | null;
  brands: string[];
  cities: string[];
  availability: Availability[];
  priceMin: number | null;
  priceMax: number | null;
  isNew: boolean;
  isPromo: boolean;
}

export type SortKey = "popular" | "priceAsc" | "priceDesc" | "newest";

const EMPTY: CatalogFilters = {
  q: "",
  category: null,
  subcategory: null,
  brands: [],
  cities: [],
  availability: [],
  priceMin: null,
  priceMax: null,
  isNew: false,
  isPromo: false,
};

function matches(p: Product, f: CatalogFilters): boolean {
  if (f.q) {
    const hay = `${p.name} ${p.brand} ${p.model} ${p.sku}`.toLowerCase();
    if (!hay.includes(f.q.toLowerCase())) return false;
  }
  if (f.category && p.categorySlug !== f.category) return false;
  if (f.subcategory && p.subcategory !== f.subcategory) return false;
  if (f.brands.length && !f.brands.includes(p.brand)) return false;
  if (f.availability.length && !f.availability.includes(p.availability)) return false;
  if (f.cities.length) {
    const city = getStore(p.storeId)?.city;
    if (!city || !f.cities.includes(city)) return false;
  }
  if (f.priceMin != null && p.price < f.priceMin) return false;
  if (f.priceMax != null && p.price > f.priceMax) return false;
  if (f.isNew && !p.isNew) return false;
  if (f.isPromo && !p.isPromo) return false;
  return true;
}

export function CatalogView({ initial }: { initial: Partial<CatalogFilters> & { sort?: SortKey } }) {
  const { t, locale } = useT();
  const router = useRouter();
  const [filters, setFilters] = useState<CatalogFilters>({ ...EMPTY, ...initial });
  const [sort, setSort] = useState<SortKey>(initial.sort ?? "popular");
  const [mobileOpen, setMobileOpen] = useState(false);

  const results = useMemo(() => {
    const list = publicProducts.filter((p) => matches(p, filters));
    const sorted = [...list];
    switch (sort) {
      case "priceAsc": sorted.sort((a, b) => a.price - b.price); break;
      case "priceDesc": sorted.sort((a, b) => b.price - a.price); break;
      case "newest": sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)); break;
      default: sorted.sort((a, b) => b.telegramClicks - a.telegramClicks);
    }
    return sorted;
  }, [filters, sort]);

  const cat = filters.category ? getCategory(filters.category) : null;
  const title = cat ? cat.name[locale] : filters.q ? `“${filters.q}”` : t("catalog.allProducts");

  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (filters.category) {
      chips.push({
        key: "cat",
        label: getCategory(filters.category)!.name[locale],
        clear: () => setFilters((f) => ({ ...f, category: null, subcategory: null })),
      });
    }
    filters.brands.forEach((b) =>
      chips.push({ key: `b-${b}`, label: b, clear: () => setFilters((f) => ({ ...f, brands: f.brands.filter((x) => x !== b) })) }),
    );
    filters.availability.forEach((a) =>
      chips.push({ key: `a-${a}`, label: t(`availability.${a}`), clear: () => setFilters((f) => ({ ...f, availability: f.availability.filter((x) => x !== a) })) }),
    );
    filters.cities.forEach((c) =>
      chips.push({ key: `c-${c}`, label: c, clear: () => setFilters((f) => ({ ...f, cities: f.cities.filter((x) => x !== c) })) }),
    );
    if (filters.isNew) chips.push({ key: "new", label: t("catalog.filterNew"), clear: () => setFilters((f) => ({ ...f, isNew: false })) });
    if (filters.isPromo) chips.push({ key: "promo", label: t("catalog.filterPromo"), clear: () => setFilters((f) => ({ ...f, isPromo: false })) });
    if (filters.priceMin != null || filters.priceMax != null)
      chips.push({ key: "price", label: `${filters.priceMin ?? 0}–${filters.priceMax ?? "∞"} ${t("common.currency")}`, clear: () => setFilters((f) => ({ ...f, priceMin: null, priceMax: null })) });
    return chips;
  }, [filters, locale, t]);

  const reset = () => {
    setFilters(EMPTY);
    router.replace("/catalog");
  };

  const panel = <FilterPanel filters={filters} setFilters={setFilters} />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <nav className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">{t("brand.name")}</Link>
          <span>/</span>
          <span className="text-foreground">{t("catalog.title")}</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground tabular">
              {t("catalog.results", { count: results.length })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="size-4" />
                  {t("common.filters")}
                  {activeChips.length > 0 && (
                    <Badge className="ml-0.5 size-5 justify-center rounded-full p-0 tabular">
                      {activeChips.length}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>{t("common.filters")}</SheetTitle>
                </SheetHeader>
                <div className="px-4 pb-4">{panel}</div>
              </SheetContent>
            </Sheet>

            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="w-[180px]" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">{t("catalog.sort.popular")}</SelectItem>
                <SelectItem value="priceAsc">{t("catalog.sort.priceAsc")}</SelectItem>
                <SelectItem value="priceDesc">{t("catalog.sort.priceDesc")}</SelectItem>
                <SelectItem value="newest">{t("catalog.sort.newest")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-32">{panel}</div>
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
