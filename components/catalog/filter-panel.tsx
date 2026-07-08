"use client";

import type { Dispatch, SetStateAction } from "react";
import { Check } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { CatalogFilters, SortKey } from "./catalog-view";
import { SORT_KEYS } from "./catalog-view";

export function FilterPanel({
  filters,
  setFilters,
  sort,
  setSort,
}: {
  filters: CatalogFilters;
  setFilters: Dispatch<SetStateAction<CatalogFilters>>;
  sort: SortKey;
  setSort: (v: SortKey) => void;
}) {
  const { t } = useT();

  return (
    <Accordion
      type="multiple"
      defaultValue={["sort", "price"]}
      className="w-full"
    >
      <AccordionItem value="sort">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.sortBy")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="-mx-1 space-y-0.5">
            {SORT_KEYS.map((key) => {
              const active = sort === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSort(key)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span>{t(`catalog.sort.${key}`)}</span>
                  {active && <Check className="size-4 shrink-0" />}
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price" className="border-b-0">
        <AccordionTrigger className="text-sm font-semibold">
          {t("catalog.filterPrice")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t("common.from")}
              value={filters.priceMin ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  priceMin: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-9 tabular focus-visible:ring-0!"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder={t("common.to")}
              value={filters.priceMax ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  priceMax: e.target.value ? Number(e.target.value) : null,
                }))
              }
              className="h-9 tabular focus-visible:ring-0!"
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
