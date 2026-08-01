"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/shared/product-image";
import { ContactSellerButton } from "@/components/product/contact-seller-button";
import { useT } from "@/components/providers/i18n-provider";
import { productCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { formatPrice } from "@/lib/format";
import { useCompare } from "@/lib/compare/use-compare";
import type { Paginated, PublicProductCard } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/** Строка таблицы: название параметра и значение у каждого товара. */
interface Row {
  label: string;
  values: (string | null)[];
  /** Значения различаются — такие строки и есть смысл сравнения. */
  differs: boolean;
}

export function CompareTable() {
  const { t, locale } = useT();
  const { items, ids, remove, clear } = useCompare();

  // Характеристики в снимке не хранятся — тянем полные карточки одним
  // запросом по ?ids=. Пока он летит, шапка уже рисуется из снимков.
  const { data, isPending } = useQuery({
    queryKey: ["compare", ids],
    // Эндпоинт описан в спеке без схемы ответа, поэтому orval типизировал его
    // как void — приводим к рукописной проекции, как и остальной код.
    queryFn: ({ signal }) =>
      productCardsControllerFindAll(
        { ids: ids.map(String), limit: ids.length },
        undefined,
        signal,
      ) as unknown as Promise<Paginated<PublicProductCard>>,
    enabled: ids.length > 0,
  });

  // Порядок колонок задаёт список сравнения, а не ответ бэкенда.
  const cards = useMemo(() => {
    const byId = new Map((data?.data ?? []).map((c) => [c.id, c]));
    return items.map((item) => byId.get(item.id) ?? null);
  }, [data, items]);

  const rows = useMemo<Row[]>(() => {
    if (items.length === 0) return [];

    const base: Row[] = [
      {
        label: t("compare.rowPrice"),
        values: items.map(
          (i) => `${formatPrice(Number(i.price), locale)} ${t("common.currency")}`,
        ),
        differs: new Set(items.map((i) => i.price)).size > 1,
      },
      {
        label: t("compare.rowState"),
        values: items.map((i) =>
          i.state === "new" ? t("compare.stateNew") : t("compare.stateOld"),
        ),
        differs: new Set(items.map((i) => i.state)).size > 1,
      },
      {
        label: t("product.store"),
        values: items.map((i) => i.shopName),
        differs: new Set(items.map((i) => i.shopName)).size > 1,
      },
    ];

    // Характеристики у товаров разные и произвольные — собираем объединение
    // ключей в порядке появления, пустые клетки помечаем прочерком.
    const keys: string[] = [];
    for (const card of cards) {
      for (const c of card?.characteristics ?? []) {
        if (!keys.includes(c.key)) keys.push(c.key);
      }
    }

    const specs: Row[] = keys.map((key) => {
      const values = cards.map(
        (card) =>
          card?.characteristics?.find((c) => c.key === key)?.value ?? null,
      );
      return {
        label: key,
        values,
        differs: new Set(values.map((v) => v ?? "")).size > 1,
      };
    });

    return [...base, ...specs];
  }, [items, cards, t, locale]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <Scale className="size-10 text-muted-foreground/60" />
        <h2 className="mt-4 font-heading text-lg font-semibold">
          {t("compare.empty")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {t("compare.emptyText")}
        </p>
        <Button asChild className="mt-6">
          <Link href="/">{t("account.history.toCatalog")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-muted-foreground">
          {t("compare.count", { count: items.length })}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-muted-foreground"
          onClick={clear}
        >
          <Trash2 className="size-4" />
          {t("compare.clear")}
        </Button>
      </div>

      {/* Таблица прокручивается внутри себя: четыре колонки не влезают в
          телефон, но страница из-за этого ездить вбок не должна. */}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-40 bg-card p-4 text-left align-top" />
              {items.map((item) => (
                <th
                  key={item.id}
                  className="min-w-[180px] border-l border-border p-4 text-left align-top font-normal"
                >
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      aria-label={t("compare.remove")}
                      className="absolute -top-1 -right-1 z-10 inline-flex size-6 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:text-destructive"
                    >
                      <X className="size-3.5" />
                    </button>

                    <Link href={`/product/${item.id}`} className="group block">
                      <ProductImage
                        hue={hueFromId(item.id)}
                        categorySlug=""
                        src={photoUrl(item.photo) ?? undefined}
                        alt={item.name}
                        className="aspect-[4/3] w-full rounded-lg"
                        iconClassName="size-10"
                      />
                      <span className="mt-2 line-clamp-2 block font-medium group-hover:text-primary">
                        {item.name}
                      </span>
                    </Link>

                    <ContactSellerButton
                      productId={String(item.id)}
                      className="mt-2 w-full"
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={cn("border-t border-border", i % 2 === 0 && "bg-muted/30")}
              >
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-10 p-4 text-left align-top font-medium",
                    i % 2 === 0 ? "bg-muted/30" : "bg-card",
                    // Различающиеся строки — то, ради чего таблицу открыли.
                    row.differs ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {row.label}
                </th>
                {row.values.map((value, j) => (
                  <td
                    key={j}
                    className={cn(
                      "border-l border-border p-4 align-top",
                      row.differs && "font-medium",
                    )}
                  >
                    {value ?? <span className="text-muted-foreground">—</span>}
                  </td>
                ))}
              </tr>
            ))}

            {isPending && (
              <tr className="border-t border-border">
                <th className="sticky left-0 z-10 bg-card p-4">
                  <Skeleton className="h-4 w-24" />
                </th>
                {items.map((item) => (
                  <td key={item.id} className="border-l border-border p-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
