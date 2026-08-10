"use client";

import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useT } from "@/components/providers/i18n-provider";
import { useCategories } from "@/lib/api/categories";
import { cn } from "@/lib/utils";

/**
 * Разделы каталога над выдачей. Горизонтальная лента, а не выпадающее меню:
 * разделов под три десятка, и на телефоне такой список листается привычнее,
 * чем раскрывается.
 *
 * Второй уровень показывается только у выбранного раздела — иначе на экране
 * оказалось бы полторы сотни ссылок сразу.
 */
export function CategoryBar({
  selected,
  selectedSubId,
  onSelect,
  onSelectSub,
}: {
  selected: string | null;
  selectedSubId: number | null;
  onSelect: (slug: string | null) => void;
  onSelectSub: (id: number | null) => void;
}) {
  const { locale } = useT();
  const { roots, isLoading } = useCategories();

  if (isLoading || roots.length === 0) return null;

  const active = roots.find((r) => r.slug === selected);

  return (
    <div className="space-y-3">
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <Button
          variant={selected ? "outline" : "default"}
          size="sm"
          className="shrink-0"
          onClick={() => onSelect(null)}
        >
          Все
        </Button>
        {roots.map((root) => (
          <Button
            key={root.id}
            variant={root.slug === selected ? "default" : "outline"}
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => onSelect(root.slug === selected ? null : root.slug)}
          >
            <CategoryIcon name={root.icon ?? undefined} className="size-4" />
            {root.name[locale]}
          </Button>
        ))}
      </div>

      {active && active.children.length > 0 && (
        <div className="flex flex-wrap gap-x-1 gap-y-1">
          <SubChip
            label={`Все · ${active.name[locale]}`}
            active={selectedSubId === null}
            onClick={() => onSelectSub(null)}
          />
          {active.children.map((child) => (
            <SubChip
              key={child.id}
              label={child.name[locale]}
              active={selectedSubId === child.id}
              onClick={() =>
                onSelectSub(selectedSubId === child.id ? null : child.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SubChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
