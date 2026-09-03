"use client";

import { ArrowUpDown, Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { CATALOG_SORTS, type CatalogSort } from "./use-catalog-filters";

const SORT_LABEL: Record<CatalogSort, string> = {
  default: "catalog.sort.default",
  newest: "catalog.sort.latest",
  price_asc: "catalog.sort.priceAsc",
  price_desc: "catalog.sort.priceDesc",
};

export function CatalogToolbar({
  sort,
  onSortChange,
  className,
}: {
  sort: CatalogSort;
  onSortChange: (sort: CatalogSort) => void;
  className?: string;
}) {
  const { t } = useT();

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
    </div>
  );
}
