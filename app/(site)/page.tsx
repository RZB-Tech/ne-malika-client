import Link from "next/link";
import { Suspense } from "react";
import { notFound, permanentRedirect } from "next/navigation";
import { BannerCarousel } from "@/components/home/banner-carousel";
import { CatalogView } from "@/components/catalog/catalog-view";
import { PageContainer } from "@/components/layout/page-container";
import { getBanners, getPublicProducts } from "@/lib/api/server";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";
import { catalogMetadata, first, pageNumber, pageHref, type SearchParams } from "@/lib/catalog-seo";

type Props = { searchParams: Promise<SearchParams> };
export async function generateMetadata({ searchParams }: Props) {
  const query = await searchParams;
  return catalogMetadata(
    "Компьютерный рынок Малика в Ташкенте онлайн",
    SITE_DESCRIPTION,
    "/",
    pageNumber(first(query.page)),
    Boolean(first(query.q).trim() || first(query.category) || first(query.sub)),
  );
}
const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl("/icon-512.png"),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    alternateName: "НеМалика",
    url: SITE_URL,
    inLanguage: "ru",
    publisher: { "@id": `${SITE_URL}/#organization` },
  },
];
export default async function HomePage({ searchParams }: Props) {
  const query = await searchParams;
  const q = first(query.q).trim();
  const page = pageNumber(first(query.page));
  if (first(query.category)) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (first(query.sub)) params.set("sub", first(query.sub));
    permanentRedirect(
      pageHref(`/category/${encodeURIComponent(first(query.category))}`, page, params.toString()),
    );
  }
  const [initial, banners] = await Promise.all([
    getPublicProducts({ page, q, sort: "newest" }),
    !q && page === 1 ? getBanners() : Promise.resolve([]),
  ]);
  if (!initial) throw new Error("Catalogue unavailable");
  if (page > Math.max(1, initial.meta.totalPages)) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      {!q && page === 1 && <BannerCarousel banners={banners} />}
      <PageContainer className="pt-6">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          {q ? `Результаты поиска: ${q}` : "Компьютерный рынок Малика онлайн"}
          {page > 1 ? ` — страница ${page}` : ""}
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Ноутбуки, компьютеры, комплектующие и периферия от магазинов рынка Малика в Ташкенте.
          Сравнивайте предложения и связывайтесь с продавцами напрямую.
        </p>
        <nav
          aria-label="Разделы каталога"
          className="mt-4 flex flex-wrap gap-4 text-sm text-primary"
        >
          <Link href="/category">Все категории</Link>
          <Link href="/category/laptops">Ноутбуки</Link>
          <Link href="/category/pc-parts">Комплектующие</Link>
          <Link href="/category/services">IT-услуги</Link>
          <Link href="/stores">Магазины</Link>
        </nav>
      </PageContainer>
      <Suspense>
        <CatalogView initialData={initial} initialQuery={q} />
      </Suspense>
    </>
  );
}
