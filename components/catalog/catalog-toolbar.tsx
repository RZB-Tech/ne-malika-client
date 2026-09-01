"use client";

import { useState } from "react";
import { ArrowUpDown, Check, Filter, RotateCcw, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/providers/i18n-provider";
import { formatPriceInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductState } from "@/lib/api/types";
import { CATALOG_SORTS, type CatalogSort, type CatalogFilterValues } from "./use-catalog-filters";

const SORT_LABEL: Record<CatalogSort, string> = {
  default: "catalog.sort.default",
  newest: "catalog.sort.latest",
  price_asc: "catalog.sort.priceAsc",
  price_desc: "catalog.sort.priceDesc",
};

const STATES: (ProductState | null)[] = [null, "new", "old"];

const STATE_LABEL: Record<"any" | ProductState, string> = {
  any: "catalog.anyState",
  new: "product.stateNew",
  old: "product.stateOld",
};

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function priceDraft(value: number | null): string {
  return value === null ? "" : formatPriceInput(value);
}

export function CatalogToolbar({
  values,
  sort,
  activeCount,
  onApply,
  onReset,
  onSortChange,
  className,
}: {
  values: CatalogFilterValues;
  sort: CatalogSort;
  activeCount: number;
  onApply: (values: CatalogFilterValues) => void;
  onReset: () => void;
  onSortChange: (sort: CatalogSort) => void;
  className?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  // Черновик панели: цена применяется по кнопке, иначе каждая цифра уходила бы
  // в адрес и в запрос к API.
  const [draftMin, setDraftMin] = useState(() => priceDraft(values.priceMin));
  const [draftMax, setDraftMax] = useState(() => priceDraft(values.priceMax));
  const [draftState, setDraftState] = useState<ProductState | null>(values.state);

  // Адрес меняется и помимо панели — по кнопке «сбросить всё» или по «назад» в
  // браузере. Сверяем черновик с адресом прямо в рендере: эффект здесь дал бы
  // лишнюю перерисовку с устаревшими полями.
  const urlKey = `${values.priceMin}|${values.priceMax}|${values.state}`;
  const [syncedKey, setSyncedKey] = useState(urlKey);
  if (urlKey !== syncedKey) {
    setSyncedKey(urlKey);
    setDraftMin(priceDraft(values.priceMin));
    setDraftMax(priceDraft(values.priceMax));
    setDraftState(values.state);
  }

  const apply = () => {
    const min = digitsOnly(draftMin);
    const max = digitsOnly(draftMax);
    let priceMin = min ? Number(min) : null;
    let priceMax = max ? Number(max) : null;

    // Перепутанные местами границы дают пустую выдачу и выглядят как поломка —
    // меняем их местами молча.
    if (priceMin !== null && priceMax !== null && priceMin > priceMax) {
      [priceMin, priceMax] = [priceMax, priceMin];
    }

    onApply({ priceMin, priceMax, state: draftState });
    setOpen(false);
  };

  const reset = () => {
    setDraftMin("");
    setDraftMax("");
    setDraftState(null);
    onReset();
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={activeCount > 0 ? "secondary" : "outline"}
          size="sm"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Filter data-icon="inline-start" />
          {t("catalog.filters")}
          {activeCount > 0 && (
            <span className="ml-1.5 inline-flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground tabular">
              {activeCount}
            </span>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <ArrowUpDown data-icon="inline-start" />
              {t(SORT_LABEL[sort])}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {CATALOG_SORTS.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => onSortChange(option)}>
                <Check className={cn("size-4", option === sort ? "opacity-100" : "opacity-0")} />
                {t(SORT_LABEL[option])}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {activeCount > 0 && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            {t("common.resetAll")}
          </Button>
        )}
      </div>

      {open && (
        <div className="mt-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t("catalog.filterPrice")}
              </legend>
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  className="h-9 w-32"
                  aria-label={`${t("catalog.filterPrice")} ${t("common.from")}`}
                  placeholder={t("common.from")}
                  value={draftMin}
                  onChange={(e) => setDraftMin(formatPriceInput(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                />
                <span className="text-muted-foreground">—</span>
                <Input
                  inputMode="numeric"
                  className="h-9 w-32"
                  aria-label={`${t("catalog.filterPrice")} ${t("common.to")}`}
                  placeholder={t("common.to")}
                  value={draftMax}
                  onChange={(e) => setDraftMax(formatPriceInput(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && apply()}
                />
                <span className="text-sm text-muted-foreground">{t("common.currency")}</span>
              </div>
            </fieldset>

            <fieldset className="min-w-0">
              <legend className="mb-1.5 text-xs font-medium text-muted-foreground">
                {t("product.state")}
              </legend>
              <div className="inline-flex rounded-lg border border-border p-0.5">
                {STATES.map((option) => (
                  <button
                    key={option ?? "any"}
                    type="button"
                    aria-pressed={draftState === option}
                    onClick={() => setDraftState(option)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      draftState === option
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(STATE_LABEL[option ?? "any"])}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={apply}>
                {t("catalog.applyFilters")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                aria-label={t("common.close")}
                onClick={() => setOpen(false)}
              >
                <X />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
