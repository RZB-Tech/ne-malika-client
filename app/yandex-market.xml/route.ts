import { connection, NextResponse } from "next/server";
import { getPublicProducts, getPublicCategories } from "@/lib/api/server";
import { photoUrl } from "@/lib/api/photo";
import { categoryEntries } from "@/lib/catalog-seo";
import { markdownToPlainText } from "@/lib/markdown";
import { SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d} ${h}:${min}`;
}

export async function GET() {
  await connection();
  // Never publish a partial or empty successful feed after an upstream failure.
  const [productsResponse, roots] = await Promise.all([
    getPublicProducts({ limit: 100, sort: "newest" }),
    getPublicCategories(),
  ]);
  if (!productsResponse) return new NextResponse("Catalogue unavailable", { status: 503 });
  const products = [...productsResponse.data];
  for (let page = 2; page <= productsResponse.meta.totalPages; page += 4) {
    const pages = await Promise.all(
      Array.from(
        { length: Math.min(4, productsResponse.meta.totalPages - page + 1) },
        (_, offset) => getPublicProducts({ page: page + offset, limit: 100, sort: "newest" }),
      ),
    );
    if (pages.some((result) => !result))
      return new NextResponse("Catalogue unavailable", { status: 503 });
    for (const result of pages) products.push(...result!.data);
  }
  const categories = categoryEntries(roots);

  const now = formatDate(new Date());

  const categoriesXml = categories
    .map(
      ({ category, path }) =>
        `      <category id="${category.id}"${path.length > 1 ? ` parentId="${path[path.length - 2].id}"` : ""}>${escapeXml(category.name.ru)}</category>`,
    )
    .join("\n");

  const categoryIds = new Set(categories.map((entry) => entry.category.id));

  const offersXml = [...new Map(products.map((p) => [p.id, p])).values()]
    .filter(
      (p) =>
        p.price !== null &&
        Number.isFinite(Number(p.price)) &&
        Number(p.price) > 0 &&
        p.categoryId != null &&
        categoryIds.has(p.categoryId),
    )
    .map((p) => {
      const url = absoluteUrl(`/product/${p.id}`);
      const picture = p.photos?.[0] ? photoUrl(p.photos[0]) : null;
      const desc = markdownToPlainText(p.description ?? "").slice(0, 500);
      const catId = p.categoryId;

      const brand = p.characteristics
        ?.find((c) => c.key.toLowerCase() === "бренд" || c.key.toLowerCase() === "brand")
        ?.value?.trim();

      return `    <offer id="${p.id}" available="true">
      <url>${escapeXml(url)}</url>
      <price>${Math.round(Number(p.price))}</price>
      <currencyId>UZS</currencyId>
      <categoryId>${catId}</categoryId>
      ${picture ? `<picture>${escapeXml(picture)}</picture>` : ""}
      <name>${escapeXml(p.name)}</name>
      ${brand ? `<vendor>${escapeXml(brand)}</vendor>` : ""}
      <description>${escapeXml(desc || p.name)}</description>
    </offer>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<yml_catalog date="${now}">
  <shop>
    <name>${escapeXml(SITE_NAME)}</name>
    <company>neMalika Market</company>
    <url>${SITE_URL}</url>
    <currencies>
      <currency id="UZS" rate="1"/>
    </currencies>
    <categories>
${categoriesXml}
    </categories>
    <offers>
${offersXml}
    </offers>
  </shop>
</yml_catalog>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
