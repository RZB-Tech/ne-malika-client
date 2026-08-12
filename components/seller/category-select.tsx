"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "@/components/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/providers/i18n-provider";
import { useCategories, findCategory } from "@/lib/api/categories";
import type { CategoryDto } from "@/lib/api/generated/schemas";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

interface Option {
  id: number;
  /** Название листа — то, что выбирают. */
  label: string;
  /** Раздел, к которому лист относится: он же заголовок группы. */
  group: string;
  /** Строка для поиска: и лист, и раздел, чтобы «ноут» находил «Игровые». */
  haystack: string;
}

function buildOptions(roots: CategoryDto[], locale: Locale): Option[] {
  const options: Option[] = [];
  for (const root of roots) {
    const group = root.name[locale];
    const items = root.children.length > 0 ? root.children : [root];
    for (const item of items) {
      const label = item.name[locale];
      options.push({
        id: item.id,
        label,
        group,
        haystack: `${group} ${label}`.toLowerCase(),
      });
    }
  }
  return options;
}

/**
 * Выбор категории с поиском. Разделов под три десятка, а листьев под две сотни —
 * прокручивать такой список руками дольше, чем набрать «ноут».
 *
 * Ищем и по разделу, и по листу: подкатегории повторяются («Игровые» есть у
 * ноутбуков, мышей и мониторов), и без раздела непонятно, какая из них какая.
 */
export function CategorySelect({
  value,
  onChange,
  disabled,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
  disabled?: boolean;
}) {
  const { t, locale } = useT();
  const { roots, isLoading } = useCategories();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const options = useMemo(
    () => buildOptions(roots, locale),
    [roots, locale],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.haystack.includes(q));
  }, [options, query]);

  const selected = findCategory(roots, value);
  const label = selected
    ? selected.category.id === selected.root.id
      ? selected.root.name[locale]
      : `${selected.root.name[locale]} · ${selected.category.name[locale]}`
    : "";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled || isLoading}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border-0 bg-muted/60 px-3.5 py-2 text-sm outline-none transition-[background-color,box-shadow]",
            "hover:bg-muted/80 focus-visible:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            "dark:bg-input/40 dark:hover:bg-input/60",
            !label && "text-muted-foreground",
          )}
        >
          <span className="truncate">
            {isLoading ? t("category.loading") : label || t("category.choose")}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <div className="flex items-center gap-2 border-b border-border/60 px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("category.search")}
            className="h-9 border-0 px-0 shadow-none focus-visible:ring-0"
          />
        </div>

        <div className="max-h-72 overflow-y-auto overscroll-contain p-1">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("category.notFound")}
            </p>
          ) : (
            filtered.map((o, i) => (
              <div key={o.id}>
                {(i === 0 || filtered[i - 1].group !== o.group) && (
                  <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">
                    {o.group}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                    o.id === value
                      ? "bg-muted font-medium"
                      : "hover:bg-muted/60",
                  )}
                >
                  <span className="truncate">{o.label}</span>
                  {o.id === value && (
                    <Check className="size-4 shrink-0 text-primary" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
