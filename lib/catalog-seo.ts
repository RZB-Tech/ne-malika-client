import type { Metadata } from "next";
import type { CategoryDto } from "@/lib/api/generated/schemas";
import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export type SearchParams = Record<string, string | string[] | undefined>;

export function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function pageNumber(value: string | null | undefined): number {
  const number = Number(value);
  return /^\d+$/.test(value ?? "") && Number.isSafeInteger(number) && number > 0 ? number : 1;
}

export function pageHref(path: string, page: number, query = ""): string {
  const params = new URLSearchParams(query);
  params.delete("page");
  if (page > 1) params.set("page", String(page));
  return `${path}${params.size ? `?${params}` : ""}`;
}

export function catalogMetadata(
  title: string,
  description: string,
  path: string,
  page = 1,
  noindex = false,
): Metadata {
  const fullTitle = `${title}${page > 1 ? ` — страница ${page}` : ""} · ${SITE_NAME}`;
  const url = absoluteUrl(pageHref(path, page));
  const images = [{ url: absoluteUrl("/social-image"), width: 1200, height: 630, alt: SITE_NAME }];
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "ru_RU",
      images,
    },
    twitter: { card: "summary_large_image", title: fullTitle, description, images },
  };
}

export type CategoryEntry = {
  category: CategoryDto;
  root: CategoryDto;
  path: CategoryDto[];
  href: string;
};

export function categoryEntries(roots: CategoryDto[]): CategoryEntry[] {
  const entries: CategoryEntry[] = [];
  function visit(category: CategoryDto, root: CategoryDto, parents: CategoryDto[]) {
    const path = [...parents, category];
    entries.push({
      category,
      root,
      path,
      href: `/category/${path.map((c) => encodeURIComponent(c.slug)).join("/")}`,
    });
    for (const child of category.children) visit(child, root, path);
  }
  for (const root of roots) visit(root, root, []);
  return entries;
}
