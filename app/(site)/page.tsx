import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageContainer } from "@/components/layout/page-container";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { getBanners, getPublicProducts } from "@/lib/api/server";
import { randomCatalogSeed } from "@/lib/catalog-seed";
import type { Paginated, PublicProductCard } from "@/lib/api/types";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, SITE_KEYWORDS, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: {
    absolute: "neMalika — компьютерный рынок Малика (Malika) в Ташкенте онлайн",
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <Suspense
        fallback={
          <PageContainer className="py-8">
            <ProductGridSkeleton count={10} />
          </PageContainer>
        }
      >
        <HomeContent />
      </Suspense>
    </>
  );
}

async function HomeContent() {
  await connection();
  const seed = randomCatalogSeed();

  const [initial, banners] = await Promise.all([
    getPublicProducts({ sort: "random", seed }),
    getBanners(),
  ]);

  return (
    <>
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
