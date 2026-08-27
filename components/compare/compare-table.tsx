"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Scale, Trash2, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/shared/product-image";
import { StatusPanel } from "@/components/shared/status-panel";
import { ContactSellerButton } from "@/components/product/contact-seller-button";
import { useT } from "@/components/providers/i18n-provider";
import { productCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { priceText } from "@/lib/format";
import { useCompare } from "@/lib/compare/use-compare";
import type { Paginated, PublicProductCard } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface Row {
  label: string;
  values: (string | null)[];
  differs: boolean;
}

export function CompareTable() {
  const { t, locale } = useT();
  const { items, ids, remove, clear } = useCompare();

  const { data, isPending } = useQuery({
    queryKey: ["compare", ids],
    queryFn: ({ signal }) =>
      productCardsControllerFindAll(
        { ids: ids.map(String), limit: ids.length },
        undefined,
        signal,
      ) as unknown as Promise<Paginated<PublicProductCard>>,
    enabled: ids.length > 0,
  });

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
          (i) => priceText(i.price, locale, t),
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
      <StatusPanel
        icon={<Scale className="size-5" />}
        title={t("compare.empty")}
        description={t("compare.emptyText")}
        action={
          <Button asChild>
            <Link href="/">{t("account.history.toCatalog")}</Link>
          </Button>
        }
      />
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

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-24 border-r border-border bg-card p-3 text-left align-top sm:w-40 sm:p-4" />
              {items.map((item) => (
                <th
                  key={item.id}
                  className="min-w-[148px] border-l border-border p-3 text-left align-top font-normal sm:min-w-[200px] sm:p-4"
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
              <tr key={row.label} className="border-t border-border">
                <th
                  scope="row"
                  className={cn(
                    "sticky left-0 z-20 border-r border-border bg-card p-3 text-left align-top font-medium sm:p-4",
                    row.differs ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {row.label}
                </th>
                {row.values.map((value, j) => (
                  <td
                    key={j}
                    className={cn(
                      "border-l border-border p-3 align-top sm:p-4",
                      i % 2 === 0 && "bg-muted/30",
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
                <th className="sticky left-0 z-20 border-r border-border bg-card p-3 sm:p-4">
                  <Skeleton className="h-4 w-16" />
                </th>
                {items.map((item) => (
                  <td key={item.id} className="border-l border-border p-3 sm:p-4">
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
