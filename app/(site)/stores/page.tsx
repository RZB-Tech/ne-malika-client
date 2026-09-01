import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { StoresView } from "@/components/store/stores-view";
import { getPublicShops } from "@/lib/api/server";
import { serializeJsonLd } from "@/lib/json-ld";
import type { PaginatedPublicShopsDto } from "@/lib/api/generated/schemas";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

const TITLE = "Магазины рынка Малика в Ташкенте";

const DESCRIPTION =
  "Все продавцы компьютерного рынка Малика (Malika) на одной странице: рейтинг, " +
  "число товаров в наличии, адрес павильона и часы работы. Переход в магазин " +
  "и связь с продавцом напрямую.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: absoluteUrl("/stores") },
  openGraph: {
    type: "website",
    title: `${TITLE} · ${SITE_NAME}`,
    description: DESCRIPTION,
    url: absoluteUrl("/stores"),
    siteName: SITE_NAME,
    locale: "ru_RU",
  },
};

export default async function StoresPage() {
  // Как и главная: страницу собираем на запрос, а не в сборке — иначе в CI,
  // где API недоступен, в прод уедет пустой список с пустой разметкой.
  await connection();
  const initial = await getPublicShops();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: absoluteUrl("/stores"),
      // Первая страница выдачи: поисковику нужны сами ссылки на магазины,
      // остальное он доберёт из sitemap.
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: initial?.meta.total ?? 0,
        itemListElement: (initial?.data ?? []).map((shop, index) => ({
          "@type": "ListItem",
          position: index + 1,
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
        <StoresView initialData={initial as PaginatedPublicShopsDto | undefined} />
      </Suspense>
    </>
  );
}
