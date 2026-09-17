import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogView } from "@/components/catalog/catalog-view";
import { ProductGridSkeleton } from "@/components/product/product-grid";
import { getPublicProducts } from "@/lib/api/server";
import { categories, getCategory } from "@/lib/data";
import { serializeJsonLd } from "@/lib/json-ld";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export async function generateStaticParams() {
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) {
    return { title: "Категория не найдена", robots: { index: false, follow: true } };
  }

  const categoryName = category?.name.ru || slug;
  const url = absoluteUrl(`/category/${slug}`);

  const title = `Купить ${categoryName} в Ташкенте — цены на рынке Малика | ${SITE_NAME}`;
  const description = `Каталог ${categoryName.toLowerCase()} на компьютерном рынке Малика (Malika) в Ташкенте: актуальные цены от проверенных магазинов, характеристики, гарантия и связь с продавцом напрямую в Telegram.`;

  const keywords = [
    categoryName,
    `купить ${categoryName}`,
    `купить ${categoryName} в Ташкенте`,
    `${categoryName} цена Ташкент`,
    `${categoryName} рынок Малика`,
    `${categoryName} Malika`,
    "рынок Малика",
    "компьютерный рынок Ташкент",
    "купить компьютер Ташкент",
    ...(category?.subcategories.map((s) => s.name.ru) ?? []),
  ];

  return {
    title: {
      absolute: title,
    },
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const categoryName = category?.name.ru || slug;
  const initial = await getPublicProducts({ category: slug, limit: 24, sort: "newest" });

  const url = absoluteUrl(`/category/${slug}`);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: `${categoryName} в Ташкенте — рынок Малика`,
      url,
      description: `Каталог ${categoryName.toLowerCase()} на компьютерном рынке Малика в Ташкенте.`,
      isPartOf: {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: SITE_NAME,
          item: absoluteUrl("/"),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: categoryName,
          item: url,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${categoryName} на рынке Малика`,
      itemListElement: (initial?.data ?? []).slice(0, 16).map((p, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        url: absoluteUrl(`/product/${p.id}`),
        name: p.name,
      })),
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageContainer className="pt-6 pb-2">
        {/* Хлебные крошки для навигации и SEO */}
        <nav
          aria-label="Хлебные крошки"
          className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
        >
          <Link href="/" className="transition-colors hover:text-foreground">
            Главная
          </Link>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">{categoryName}</span>
        </nav>

        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {categoryName} в Ташкенте на рынке Малика
          </h1>
          <p className="text-sm text-muted-foreground max-w-3xl">
            Актуальные предложения и цены от магазинов компьютерного рынка Малика (Malika).
            Сравнение моделей, гарантия и прямая связь с продавцами.
          </p>
        </div>

        {/* Подкатегории для быстрой навигации и SEO */}
        {category && category.subcategories.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {category.subcategories.map((sub) => (
              <span
                key={sub.slug}
                className="rounded-full border border-border/80 bg-card px-3 py-1 text-xs text-muted-foreground"
              >
                {sub.name.ru}
              </span>
            ))}
          </div>
        )}
      </PageContainer>

      <Suspense
        fallback={
          <PageContainer className="py-8">
            <ProductGridSkeleton count={12} />
          </PageContainer>
        }
      >
        <CatalogView initialData={initial ?? undefined} forcedCategory={slug} />
      </Suspense>
    </>
  );
}
