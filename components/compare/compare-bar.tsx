"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/shared/product-image";
import { useT } from "@/components/providers/i18n-provider";
import { useCompare } from "@/lib/compare/use-compare";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";

/**
 * Панель выбранного к сравнению — висит внизу витрины, пока в списке есть
 * товары. Живёт в layout, а не на конкретной странице: набирают сравнение с
 * карточек по всему сайту, и панель должна ехать следом.
 *
 * На самой /compare скрыта: там список и так перед глазами.
 */
export function CompareBar() {
  const { t } = useT();
  const pathname = usePathname();
  const { items, remove, clear } = useCompare();

  if (items.length === 0 || pathname === "/compare") return null;

  return (
    <div className="pointer-events-none sticky bottom-0 z-40 px-4 pb-4 sm:px-8">
      <div className="pointer-events-auto mx-auto flex max-w-[1600px] items-center gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur">
        <Scale className="ml-1 hidden size-5 shrink-0 text-primary sm:block" />

        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
          {items.map((item) => (
            <div key={item.id} className="relative shrink-0">
              <ProductImage
                hue={hueFromId(item.id)}
                categorySlug=""
                src={photoUrl(item.photo) ?? undefined}
                alt={item.name}
                className="size-12 rounded-lg"
                iconClassName="size-5"
              />
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={t("compare.remove")}
                className="absolute -top-1.5 -right-1.5 inline-flex size-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={clear}
            className="hidden text-xs text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            {t("compare.clear")}
          </button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/compare">
              {t("compare.open")}
              <span className="tabular">{items.length}</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
