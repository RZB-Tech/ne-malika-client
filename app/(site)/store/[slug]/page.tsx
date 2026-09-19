import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { StoreDetail } from "@/components/store/store-detail";
import { getPublicShop } from "@/lib/api/server";
import { mapProductRow, mapShop } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { markdownToPlainText } from "@/lib/markdown";
import { serializeJsonLd } from "@/lib/json-ld";
import type { WorkScheduleEntry } from "@/lib/api/types";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

const DAY_URLS: Record<WorkScheduleEntry["day"], string> = {
  Mo: "https://schema.org/Monday",
  Tu: "https://schema.org/Tuesday",
  We: "https://schema.org/Wednesday",
  Th: "https://schema.org/Thursday",
  Fr: "https://schema.org/Friday",
  Sa: "https://schema.org/Saturday",
  Su: "https://schema.org/Sunday",
};

function parseId(slug: string): number | null {
  const id = Number(slug);
  return /^\d+$/.test(slug) && Number.isSafeInteger(id) && id > 0 ? id : null;
}

function shopDescription(
  shop: { name: string; description: string | null; address: string | null },
  productCount: number,
): string {
  const own = markdownToPlainText(shop.description ?? "").trim();
  return [
    own || `${shop.name} — магазин компьютерной техники на рынке Малика в Ташкенте.`,
    productCount > 0 && `В продаже ${productCount} товаров.`,
    shop.address && `Адрес: ${shop.address}.`,
    "Цены, отзыв и связь с продавцом на neMalika.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const id = parseId(slug);
  if (id === null) notFound();

  const shop = await getPublicShop(id);
  if (!shop) {
    return { title: "Магазин не найден", robots: { index: false, follow: true } };
  }

  const url = absoluteUrl(`/store/${shop.id}`);
  const description = shopDescription(shop, shop.productCards?.length ?? 0);
  const image = photoUrl(shop.photo);

  return {
    title: shop.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${shop.name} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      images: image ? [{ url: image, alt: shop.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: shop.name,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function StorePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = parseId(slug);
  if (id === null) notFound();

  const shop = await getPublicShop(id);
  if (!shop) notFound();
  if (slug !== String(shop.id)) permanentRedirect(`/store/${shop.id}`);

  const store = mapShop(shop);
  const products = (shop.productCards ?? []).map((pc) => mapProductRow(pc, shop.name));

  const url = absoluteUrl(`/store/${shop.id}`);
  const image = photoUrl(shop.photo);
  const hours = (shop.workSchedule ?? []).filter((entry) => !entry.isHoliday);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Store",
      "@id": url,
      name: shop.name,
      url,
      description: markdownToPlainText(shop.description ?? "") || undefined,
      image: image ?? undefined,
      telephone: shop.contact || undefined,
      sameAs: shop.telegramLink ? [shop.telegramLink] : undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: shop.address ?? undefined,
        addressLocality: "Ташкент",
        addressCountry: "UZ",
      },
      // location приходит парой [широта, долгота]; без обеих координат
      // блок geo только путает разметку.
      geo:
        shop.location?.length === 2 &&
        shop.location.every(Number.isFinite) &&
        Math.abs(shop.location[0]) <= 90 &&
        Math.abs(shop.location[1]) <= 180
          ? {
              "@type": "GeoCoordinates",
              latitude: shop.location[0],
              longitude: shop.location[1],
            }
          : undefined,
      openingHoursSpecification: hours.length
        ? hours.map((entry) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: DAY_URLS[entry.day],
            opens: entry.start,
            closes: entry.end,
          }))
        : undefined,
      aggregateRating:
        shop.ratingCount &&
        shop.ratingCount > 0 &&
        Number.isFinite(shop.ratingAvg) &&
        (shop.ratingAvg ?? 0) >= 1 &&
        (shop.ratingAvg ?? 0) <= 5
          ? {
              "@type": "AggregateRating",
              ratingValue: Number((shop.ratingAvg ?? 0).toFixed(1)),
              reviewCount: shop.ratingCount,
              bestRating: 5,
              worstRating: 1,
            }
          : undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: "Магазины", item: absoluteUrl("/stores") },
        { "@type": "ListItem", position: 3, name: shop.name },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <StoreDetail store={store} products={products} />
    </>
  );
}
