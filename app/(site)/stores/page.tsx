import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StoresView } from "@/components/store/stores-view";
import { getPublicShops } from "@/lib/api/server";
import { serializeJsonLd } from "@/lib/json-ld";
import type { PaginatedPublicShopsDto } from "@/lib/api/generated/schemas";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { ShopsControllerFindAllSort } from "@/lib/api/generated/schemas";
import { catalogMetadata, first, pageNumber, pageHref, type SearchParams } from "@/lib/catalog-seo";

const TITLE = "Магазины рынка Малика в Ташкенте";

const DESCRIPTION =
  "Все продавцы компьютерного рынка Малика (Malika) на одной странице: рейтинг, " +
  "число товаров в наличии, адрес павильона и часы работы. Переход в магазин " +
  "и связь с продавцом напрямую.";

type Props = { searchParams: Promise<SearchParams> };
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const query = await searchParams;
  return catalogMetadata(
    TITLE,
    DESCRIPTION,
    "/stores",
    pageNumber(first(query.page)),
    Boolean(first(query.q).trim() || (first(query.sort) && first(query.sort) !== "products")),
  );
}

export default async function StoresPage({ searchParams }: Props) {
  const query = await searchParams;
  const page = pageNumber(first(query.page));
  const q = first(query.q).trim();
  const sort =
    Object.values(ShopsControllerFindAllSort).find((value) => value === first(query.sort)) ??
    "products";
  const initial = await getPublicShops({ page, q, sort });
  if (!initial) throw new Error("Shop catalogue unavailable");
  if (page > Math.max(1, initial.meta.totalPages)) notFound();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: absoluteUrl(pageHref("/stores", page)),
      // Первая страница выдачи: поисковику нужны сами ссылки на магазины,
      // остальное он доберёт из sitemap.
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: initial?.meta.total ?? 0,
        itemListElement: (initial?.data ?? []).map((shop, index) => ({
          "@type": "ListItem",
          position: (page - 1) * 24 + index + 1,
          name: shop.name,
          url: absoluteUrl(`/store/${shop.id}`),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Магазины" },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Suspense>
        <StoresView
          initialData={initial as PaginatedPublicShopsDto}
          initialQuery={q}
          initialSort={sort}
        />
      </Suspense>
    </>
  );
}
