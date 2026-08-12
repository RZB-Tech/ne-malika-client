import type { Metadata } from "next";
import { Suspense } from "react";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getPublicProducts } from "@/lib/api/server";
import type { Paginated, PublicProductCard } from "@/lib/api/types";
import {
  SITE_NAME,
  SITE_URL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  absoluteUrl,
} from "@/lib/seo";

export const revalidate = 120;

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
  const initial = await getPublicProducts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Suspense>
        <CatalogView
          initialData={initial as Paginated<PublicProductCard> | undefined}
        />
      </Suspense>
    </>
  );
}
