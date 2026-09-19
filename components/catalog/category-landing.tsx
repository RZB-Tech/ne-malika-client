import { cache, Suspense } from "react";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublicCategories, getPublicProducts } from "@/lib/api/server";
import {
  categoryEntries,
  catalogMetadata,
  first,
  pageNumber,
  pageHref,
  type SearchParams,
} from "@/lib/catalog-seo";
import { absoluteUrl } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/json-ld";
import { PageContainer } from "@/components/layout/page-container";
import { CatalogView } from "./catalog-view";

type Props = {
  params: Promise<{ slug: string; path?: string[] }>;
  searchParams: Promise<SearchParams>;
};
const getEntries = cache(async () => categoryEntries(await getPublicCategories()));
const getListing = cache((root: string, id: number | undefined, page: number, q: string) =>
  getPublicProducts({
    ...(id ? { categoryId: id } : { category: root }),
    page,
    q,
    limit: 24,
    sort: "newest",
  }),
);

async function resolve(props: Props) {
  const [params, query, entries] = await Promise.all([
    props.params,
    props.searchParams,
    getEntries(),
  ]);
  const href = `/category/${[params.slug, ...(params.path ?? [])].map(encodeURIComponent).join("/")}`;
  const entry = entries.find((e) => e.href === href);
  const page = pageNumber(first(query.page));
  const q = first(query.q).trim();
  if (!entry) {
    // Preserve old root-level links to categories that now live inside a group.
    const legacySlug = params.slug === "components" ? "pc-parts" : params.slug;
    const matches = params.path?.length
      ? []
      : entries.filter((e) => e.category.slug === legacySlug);
    if (matches.length === 1)
      permanentRedirect(
        pageHref(matches[0].href, page, q ? new URLSearchParams({ q }).toString() : ""),
      );
    notFound();
  }
  const sub = first(query.sub);
  if (sub) {
    const child = entries.find((e) => e.category.id === Number(sub) && e.root.id === entry.root.id);
    if (!child) notFound();
    permanentRedirect(pageHref(child.href, page, q ? new URLSearchParams({ q }).toString() : ""));
  }
  const categoryId = entry.path.length > 1 ? entry.category.id : undefined;
  const initial = await getListing(entry.root.slug, categoryId, page, q);
  if (!initial) throw new Error("Catalogue unavailable");
  if (page > Math.max(1, initial.meta.totalPages)) notFound();
  return { entry, entries, page, q, initial, categoryId };
}

export async function categoryMetadata(props: Props) {
  const { entry, page, q, initial } = await resolve(props);
  return catalogMetadata(
    `${entry.category.name.ru} в Ташкенте — рынок Малика`,
    `${entry.category.name.ru}: предложения магазинов рынка Малика на neMalika. Сравните цены и характеристики, свяжитесь с продавцом напрямую.`,
    entry.href,
    page,
    Boolean(q) || initial.meta.total === 0,
  );
}

export async function CategoryPage(props: Props) {
  const { entry, entries, page, q, initial, categoryId } = await resolve(props);
  const crumbs = [
    { name: "Главная", href: "/" },
    { name: "Каталог", href: "/category" },
    ...entry.path.map((category) => ({
      name: category.name.ru,
      href: entries.find((e) => e.category.id === category.id)!.href,
    })),
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: c.name,
        item: absoluteUrl(c.href),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: entry.category.name.ru,
      url: absoluteUrl(pageHref(entry.href, page)),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: initial.data.map((p, index) => ({
          "@type": "ListItem",
          position: (page - 1) * 24 + index + 1,
          name: p.name,
          url: absoluteUrl(`/product/${p.id}`),
        })),
      },
    },
  ];
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <PageContainer className="pt-6 pb-2">
        <nav
          aria-label="Хлебные крошки"
          className="mb-4 flex flex-wrap gap-2 text-xs text-muted-foreground"
        >
          {crumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && " / "}
              <Link href={c.href} aria-current={i === crumbs.length - 1 ? "page" : undefined}>
                {c.name}
              </Link>
            </span>
          ))}
        </nav>
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          {entry.category.name.ru} в Ташкенте{page > 1 ? ` — страница ${page}` : ""}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Предложения магазинов рынка Малика. Сравните цены и характеристики; наличие, условия
          покупки и гарантию уточняйте у продавца.
        </p>
        <nav aria-label="Подкатегории" className="mt-5 flex flex-wrap gap-2">
          {entry.category.children.map((child) => (
            <Link
              key={child.id}
              href={entries.find((e) => e.category.id === child.id)!.href}
              className="rounded-full border px-3 py-1 text-sm hover:text-primary"
            >
              {child.name.ru}
            </Link>
          ))}
        </nav>
      </PageContainer>
      <Suspense>
        <CatalogView
          initialData={initial}
          forcedCategory={entry.root.slug}
          forcedSubCategoryId={categoryId}
          initialQuery={q}
        />
      </Suspense>
    </>
  );
}
