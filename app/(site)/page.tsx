import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getBanners, getPublicProducts } from "@/lib/api/server";
import { randomCatalogSeed } from "@/lib/catalog-seed";
import type { Paginated, PublicProductCard } from "@/lib/api/types";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  absoluteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute:
      "neMalika — компьютерный рынок Малика (Malika) в Ташкенте онлайн",
  },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  alternates: { canonical: absoluteUrl("/") },
  openGraph: {
    type: "website",
    title: "neMalika — рынок Малика (Malika) в Ташкенте онлайн",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ru_RU",
  },
};

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    areaServed: { "@type": "City", name: "Tashkent" },
    location: {
      "@type": "Place",
      name: "Компьютерный рынок Малика (Malika)",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Ташкент",
        addressCountry: "UZ",
      },
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "ru",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
];

export default async function HomePage() {
  /**
   * Витрина перемешивается на каждый заход, поэтому страница собирается под
   * запрос, а не отдаётся из кэша на две минуты, как раньше: иначе все
   * посетители эти две минуты видели бы один и тот же «случайный» порядок, а
   * перезагрузка ничего не меняла бы.
   *
   * `connection()` — то место, где кончается предрендер: зерно берётся из
   * Math.random(), и посчитать его заранее, на сборке, нельзя.
   *
   * Баннеры от этого не страдают: у их запроса свой кэш на две минуты.
   */
  await connection();
  const seed = randomCatalogSeed();

  /** Оба запроса разом: каталог не должен ждать баннеры, а баннеры — каталог. */
  const [initial, banners] = await Promise.all([
    getPublicProducts({ sort: "random", seed }),
    getBanners(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BannerCarousel banners={banners} />
      <Suspense>
        <CatalogView
          initialData={initial as Paginated<PublicProductCard> | undefined}
          seed={seed}
        />
      </Suspense>
    </>
  );
}
