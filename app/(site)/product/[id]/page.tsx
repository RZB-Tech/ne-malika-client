import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductRail } from "@/components/product/product-rail";
import { TrackProductView } from "@/components/product/track-product-view";
import { PageContainer } from "@/components/layout/page-container";
import {
  getPublicProduct,
  getPublicProducts,
  getPublicShop,
  getPublicCategories,
} from "@/lib/api/server";
import { categoryEntries } from "@/lib/catalog-seo";
import { mapPublicProductCard, mapShop } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { markdownToPlainText } from "@/lib/markdown";
import { serializeJsonLd } from "@/lib/json-ld";
import type { Store } from "@/lib/data";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

// Берём с запасом: из выдачи выпадет сам товар, а для «похожих» ещё и все
// карточки этого же магазина.
const RAIL_FETCH = 16;

const RAIL_SIZE = 8;

function specsSummary(
  characteristics: { key: string; value: string }[] | null | undefined,
  max = 4,
): string {
  return (characteristics ?? [])
    .slice(0, max)
    .map((c) => `${c.key}: ${c.value}`)
    .join(" · ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(numId) || numId < 1) notFound();

  const product = await getPublicProduct(numId);
  if (!product) {
    return { title: "Товар не найден", robots: { index: false, follow: true } };
  }

  const isOld = product.state === "old";
  const stateBadge = isOld ? " (б/у)" : "";
  const priceFormatted =
    product.price === null
      ? "цена договорная"
      : `${new Intl.NumberFormat("ru-RU").format(Number(product.price))} сум`;

  const title = `${product.name}${stateBadge} — купить в Ташкенте · ${SITE_NAME}`;

  const priceLine = product.price === null ? "Цена договорная." : `Цена ${priceFormatted}.`;
  const specs = specsSummary(product.characteristics);
  const descLead = `Купить ${product.name}${stateBadge} в Ташкенте на компьютерном рынке Малика (Malika). ${priceLine} Магазин: ${product.shopName}.`;
  const descTail = specs
    ? `Характеристики: ${specs}.`
    : markdownToPlainText(product.description ?? "").slice(0, 120) ||
      "Свяжитесь с продавцом, чтобы уточнить наличие и условия покупки.";
  const description = `${descLead} ${descTail}`.slice(0, 200);

  const keywords = [
    product.name,
    `купить ${product.name}`,
    `${product.name} цена`,
    `${product.name} Ташкент`,
    `${product.name} на Малике`,
    "рынок Малика",
    "компьютерный рынок Ташкент",
    ...(product.categoryNameRu
      ? [
          product.categoryNameRu,
          `купить ${product.categoryNameRu} Ташкент`,
          `${product.categoryNameRu} Малика`,
        ]
      : []),
    product.shopName,
  ];

  const url = absoluteUrl(`/product/${product.id}`);
  const image = photoUrl(product.photos?.[0]);

  return {
    title: {
      absolute: title,
    },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `Купить ${product.name}${stateBadge} в Ташкенте — ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `Купить ${product.name}${stateBadge} в Ташкенте`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numId = Number(id);
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(numId) || numId < 1) notFound();

  const raw = await getPublicProduct(numId);
  if (!raw) notFound();
  if (id !== String(raw.id)) permanentRedirect(`/product/${raw.id}`);

  const product = mapPublicProductCard(raw);

  const [shopRaw, storeList, categoryList, categories] = await Promise.all([
    getPublicShop(raw.shopId),
    getPublicProducts({ shopId: raw.shopId, limit: RAIL_FETCH, sort: "newest" }),
    raw.categoryId
      ? getPublicProducts({ categoryId: raw.categoryId, limit: RAIL_FETCH, sort: "newest" })
      : Promise.resolve(null),
    getPublicCategories(),
  ]);
  const categoryHref = categoryEntries(categories).find(
    (entry) => entry.category.id === raw.categoryId,
  )?.href;

  const fromStore = (storeList?.data ?? [])
    .filter((p) => p.id !== raw.id)
    .slice(0, RAIL_SIZE)
    .map(mapPublicProductCard);

  // Товары того же магазина уже показаны рядом — во второй ленте они были бы
  // повтором, поэтому «похожие» берём из категории за вычетом этого магазина.
  const similar = (categoryList?.data ?? [])
    .filter((p) => p.id !== raw.id && p.shopId !== raw.shopId)
    .slice(0, RAIL_SIZE)
    .map(mapPublicProductCard);

  const store: Store = shopRaw
    ? mapShop(shopRaw)
    : {
        id: String(product.storeId),
        slug: String(product.storeId),
        name: product.brand || "Магазин",
        logoHue: product.hue,
        description: "",
        address: "",
        city: "",
        phone: "",
        telegram: "",
        workingHours: "",
        rating: 0,
        ratingCount: 0,
        joined: product.createdAt,
        status: "active",
        storeViews: 0,
      };

  const brandName = raw.characteristics
    ?.find((c) => c.key.toLowerCase() === "бренд" || c.key.toLowerCase() === "brand")
    ?.value?.trim();

  const modelName = raw.characteristics
    ?.find((c) => c.key.toLowerCase() === "модель" || c.key.toLowerCase() === "model")
    ?.value?.trim();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": absoluteUrl(`/product/${raw.id}#product`),
    url: absoluteUrl(`/product/${raw.id}`),
    name: raw.name,
    description: raw.description ? markdownToPlainText(raw.description) : undefined,
    image: (raw.photos ?? []).map((k) => photoUrl(k)).filter((u): u is string => Boolean(u)),
    sku: String(raw.id),
    model: modelName || undefined,
    brand: brandName
      ? {
          "@type": "Brand",
          name: brandName,
        }
      : undefined,
    category: raw.categoryNameRu || undefined,
    additionalProperty: (raw.characteristics ?? []).map((c) => ({
      "@type": "PropertyValue",
      name: c.key,
      value: c.value,
    })),
    offers:
      raw.price === null || !Number.isFinite(Number(raw.price)) || Number(raw.price) < 0
        ? undefined
        : {
            "@type": "Offer",
            price: Number(raw.price),
            priceCurrency: "UZS",
            itemCondition:
              raw.state === "new"
                ? "https://schema.org/NewCondition"
                : "https://schema.org/UsedCondition",
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/product/${raw.id}`),
            seller: {
              "@type": "Organization",
              name: raw.shopName,
              url: absoluteUrl(`/store/${raw.shopId}`),
            },
          },
    // Only publish a real rating shown on the page. Structured data makes
    // a result eligible for enhancements; it does not guarantee stars in search.
    aggregateRating:
      raw.ratingCount &&
      raw.ratingCount > 0 &&
      Number.isFinite(raw.ratingAvg) &&
      (raw.ratingAvg ?? 0) >= 1 &&
      (raw.ratingAvg ?? 0) <= 5
        ? {
            "@type": "AggregateRating",
            ratingValue: Number((raw.ratingAvg ?? 0).toFixed(1)),
            reviewCount: raw.ratingCount,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };

  const breadcrumbItems: {
    "@type": string;
    position: number;
    name: string;
    item?: string;
  }[] = [{ "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") }];

  if (raw.categoryNameRu && categoryHref) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: raw.categoryNameRu,
      item: absoluteUrl(categoryHref),
    });
  }

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: raw.shopName,
    item: absoluteUrl(`/store/${raw.shopId}`),
  });

  breadcrumbItems.push({
    "@type": "ListItem",
    position: breadcrumbItems.length + 1,
    name: raw.name,
    item: absoluteUrl(`/product/${raw.id}`),
  });

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbItems,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([jsonLd, breadcrumbsLd]) }}
      />
      <TrackProductView
        product={{
          id: raw.id,
          shopId: raw.shopId,
          shopName: raw.shopName ?? store.name,
          name: raw.name,
          price: raw.price,
          photo: raw.photos?.[0] ?? null,
          state: raw.state,
        }}
      />
      <ProductDetail product={product} store={store} categoryHref={categoryHref} />

      <PageContainer className="pb-12">
        <ProductRail titleKey="product.moreFromStore" products={fromStore} />
        <ProductRail titleKey="product.similar" products={similar} />
      </PageContainer>
    </>
  );
}
