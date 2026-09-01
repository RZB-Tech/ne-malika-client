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

  const priceLine =
    product.price === null
      ? "Цена договорная."
      : `Цена ${new Intl.NumberFormat("ru-RU").format(Number(product.price))} сум.`;
  const specs = specsSummary(product.characteristics);
  const descBase =
    markdownToPlainText(product.description ?? "") ||
    `${product.name} — купить на рынке Малика (Malika) в Ташкенте.`;
  const description = [
    descBase,
    specs && `Характеристики: ${specs}.`,
    `${priceLine} Продавец: ${product.shopName}. Рынок Малика, Ташкент.`,
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 300);

  const url = absoluteUrl(`/product/${product.id}`);
  const image = photoUrl(product.photos?.[0]);

  return {
    title: product.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${product.name} · ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: raw.name,
    description: raw.description ? markdownToPlainText(raw.description) : undefined,
    image: (raw.photos ?? []).map((k) => photoUrl(k)).filter(Boolean),
    sku: String(raw.id),
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
            availability: "https://schema.org/InStock",
            url: absoluteUrl(`/product/${raw.id}`),
            seller: { "@type": "Organization", name: raw.shopName },
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

  const breadcrumbsLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: absoluteUrl("/") },
      {
        "@type": "ListItem",
        position: 2,
        name: raw.shopName,
        item: absoluteUrl(`/store/${raw.shopId}`),
      },
      { "@type": "ListItem", position: 3, name: raw.name },
    ],
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
