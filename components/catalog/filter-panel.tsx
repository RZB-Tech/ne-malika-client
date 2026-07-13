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
import type { PriceRange, SortKey } from "./catalog-view";
import { SORT_KEYS } from "./catalog-view";

export function FilterPanel({
  filters,
  setFilters,
  sort,
  setSort,
}: {
  filters: PriceRange;
  setFilters: Dispatch<SetStateAction<PriceRange>>;
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
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          {t("catalog.sortBy")}
        </AccordionTrigger>
        <AccordionContent>
          {/* Pulled out by the button padding so the labels sit on the same
              vertical line as the section heading above them. */}
          <div className="-mx-2 flex flex-col">
            {SORT_KEYS.map((key) => {
              const active = sort === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSort(key)}
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors",
                    active
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span>{t(`catalog.sort.${key}`)}</span>
                  {active && <Check className="size-4 shrink-0 text-primary" />}
                </button>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="price">
        <AccordionTrigger className="text-sm font-semibold hover:no-underline">
          {t("catalog.filterPrice")}, {t("common.currency")}
        </AccordionTrigger>
        <AccordionContent>
          <div className="flex items-center gap-2">
            <PriceInput
              placeholder={t("common.from")}
              value={filters.priceMin}
              onValueChange={(priceMin) => setFilters((f) => ({ ...f, priceMin }))}
            />
            <span aria-hidden className="text-muted-foreground">
              —
            </span>
            <PriceInput
              placeholder={t("common.to")}
              value={filters.priceMax}
              onValueChange={(priceMax) => setFilters((f) => ({ ...f, priceMax }))}
            />
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function PriceInput({
  placeholder,
  value,
  onValueChange,
}: {
  placeholder: string;
  value: number | null;
  onValueChange: (value: number | null) => void;
}) {
  return (
    <Input
      type="number"
      inputMode="numeric"
      min={0}
      aria-label={placeholder}
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => onValueChange(e.target.value ? Number(e.target.value) : null)}
      // The spinner arrows crowd an input this narrow and there is nothing
      // sensible to step by on a price.
      className="tabular [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
    />
  );
}
