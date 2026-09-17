import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product/product-detail";
import { ProductRail } from "@/components/product/product-rail";
import { TrackProductView } from "@/components/product/track-product-view";
import { PageContainer } from "@/components/layout/page-container";
import { getPublicProduct, getPublicProducts, getPublicShop } from "@/lib/api/server";
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
  if (!Number.isFinite(numId)) return {};

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

  const title = `Купить ${product.name}${stateBadge} в Ташкенте — ${priceFormatted} на рынке Малика | ${SITE_NAME}`;

  const priceLine =
    product.price === null
      ? "Цена договорная."
      : `Цена ${priceFormatted}.`;
  const specs = specsSummary(product.characteristics);
  const descLead = `Купить ${product.name}${stateBadge} в Ташкенте на компьютерном рынке Малика (Malika). ${priceLine} Магазин: ${product.shopName}.`;
  const descTail = specs
    ? `Характеристики: ${specs}. Гарантия, прямая связь с магазином в Telegram.`
    : (markdownToPlainText(product.description ?? "").slice(0, 120) ||
       "Гарантия, актуальные цены, прямая связь с магазином в Telegram.");
  const description = `${descLead} ${descTail}`.slice(0, 300);

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
  if (!Number.isFinite(numId)) notFound();

  const raw = await getPublicProduct(numId);
  if (!raw) notFound();

  const product = mapPublicProductCard(raw);

  const [shopRaw, storeList, categoryList] = await Promise.all([
    getPublicShop(raw.shopId),
    getPublicProducts({ shopId: raw.shopId, limit: RAIL_FETCH, sort: "newest" }),
    raw.categoryId
      ? getPublicProducts({ categoryId: raw.categoryId, limit: RAIL_FETCH, sort: "newest" })
      : Promise.resolve(null),
  ]);

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

  const brandName =
    raw.characteristics?.find(
      (c) => c.key.toLowerCase() === "бренд" || c.key.toLowerCase() === "brand",
    )?.value?.trim() ||
    raw.shopName ||
    SITE_NAME;

  const modelName = raw.characteristics?.find(
    (c) => c.key.toLowerCase() === "модель" || c.key.toLowerCase() === "model",
  )?.value?.trim();

  const validUntil = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: raw.name,
    description: raw.description ? markdownToPlainText(raw.description) : undefined,
    image: (raw.photos ?? []).map((k) => photoUrl(k)).filter((u): u is string => Boolean(u)),
    sku: String(raw.id),
    mpn: modelName || String(raw.id),
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: raw.categoryNameRu || undefined,
    additionalProperty: (raw.characteristics ?? []).map((c) => ({
      "@type": "PropertyValue",
      name: c.key,
      value: c.value,
    })),
    offers:
      raw.price === null
        ? undefined
        : {
            "@type": "Offer",
            price: Number(raw.price),
            priceCurrency: "UZS",
            priceValidUntil: validUntil,
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
    // Оценка уже показана на странице звёздами — без этого блока поисковик
    // её не видит и звёзд в выдаче не рисует. Без отзывов блок не выводим:
    // aggregateRating с нулём Google считает ошибкой разметки.
    aggregateRating:
      raw.ratingCount && raw.ratingCount > 0
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
  }[] = [
    { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
  ];

  if (raw.categoryNameRu && raw.categorySlug) {
    breadcrumbItems.push({
      "@type": "ListItem",
      position: breadcrumbItems.length + 1,
      name: raw.categoryNameRu,
      item: absoluteUrl(`/category/${raw.categorySlug}`),
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
      <ProductDetail product={product} store={store} />

      <PageContainer className="pb-12">
        <ProductRail titleKey="product.moreFromStore" products={fromStore} />
        <ProductRail titleKey="product.similar" products={similar} />
      </PageContainer>
    </>
  );
}
