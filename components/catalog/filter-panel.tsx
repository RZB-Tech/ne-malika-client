"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useT } from "@/components/providers/i18n-provider";
import {
  categories,
  cities as allCities,
  publicProducts,
  type Availability,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import type { CatalogFilters } from "./catalog-view";

const AVAIL: Availability[] = ["in_stock", "on_order", "out_of_stock"];

export function FilterPanel({
  filters,
  setFilters,
}: {
  filters: CatalogFilters;
  setFilters: Dispatch<SetStateAction<CatalogFilters>>;
}) {
  const { t, locale } = useT();

  // brands relevant to the current category selection
  const brands = useMemo(() => {
    const pool = filters.category
      ? publicProducts.filter((p) => p.categorySlug === filters.category)
      : publicProducts;
    return Array.from(new Set(pool.map((p) => p.brand))).sort();
  }, [filters.category]);

  const toggle = <K extends "brands" | "cities" | "availability">(
    key: K,
    value: CatalogFilters[K][number],
  ) =>
    setFilters((f) => {
      const arr = f[key] as string[];
      const next = arr.includes(value as string)
        ? arr.filter((x) => x !== value)
        : [...arr, value as string];
      return { ...f, [key]: next };
    });

  return (
    <Accordion
      type="multiple"
      defaultValue={["category", "price", "brand", "availability", "extra"]}
      className="w-full"
    >
      <AccordionItem value="category">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.filterCategory")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="-mx-1 max-h-64 space-y-0.5 overflow-y-auto scroll-slim pr-1">
            {categories.map((c) => {
              const active = filters.category === c.slug;
              return (
                <button
                  key={c.slug}
                  onClick={() =>
                    setFilters((f) => ({
                      ...f,
                      category: active ? null : c.slug,
                      subcategory: null,
                    }))
                  }
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <CategoryIcon name={c.icon} className="size-4 shrink-0" />
                  <span className="truncate">{c.name[locale]}</span>
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.filterPrice")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              placeholder={t("common.from")}
              value={filters.priceMin ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  priceMin: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-9 tabular"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              inputMode="numeric"
              placeholder={t("common.to")}
              value={filters.priceMax ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  priceMax: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-9 tabular"
            />
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="brand">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.filterBrand")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="-mx-1 max-h-56 space-y-1 overflow-y-auto scroll-slim px-1">
            {brands.map((b) => (
              <label
                key={b}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={filters.brands.includes(b)}
                  onCheckedChange={() => toggle("brands", b)}
                />
                <span className="text-foreground/90">{b}</span>
              </label>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="availability">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.filterAvailability")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1">
            {AVAIL.map((a) => (
              <label
                key={a}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={filters.availability.includes(a)}
                  onCheckedChange={() => toggle("availability", a)}
                />
                <span className="text-foreground/90">{t(`availability.${a}`)}</span>
              </label>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="city">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.filterCity")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-1">
            {allCities.map((c) => (
              <label
                key={c}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 text-sm hover:bg-muted"
              >
                <Checkbox
                  checked={filters.cities.includes(c)}
                  onCheckedChange={() => toggle("cities", c)}
                />
                <span className="text-foreground/90">{c}</span>
              </label>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="extra" className="border-b-0">
        <AccordionTrigger className="text-sm font-semibold">
          {t("common.filters")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="f-new" className="cursor-pointer text-sm font-normal text-foreground/90">
                {t("catalog.filterNew")}
              </Label>
              <Switch
                id="f-new"
                checked={filters.isNew}
                onCheckedChange={(v) => setFilters((f) => ({ ...f, isNew: v }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="f-promo" className="cursor-pointer text-sm font-normal text-foreground/90">
                {t("catalog.filterPromo")}
              </Label>
              <Switch
                id="f-promo"
                checked={filters.isPromo}
                onCheckedChange={(v) => setFilters((f) => ({ ...f, isPromo: v }))}
              />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
