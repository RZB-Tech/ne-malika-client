import { NextResponse } from "next/server";
import { getPublicProducts } from "@/lib/api/server";
import { photoUrl } from "@/lib/api/photo";
import { categories } from "@/lib/data";
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
  // Загружаем актуальные опубликованные товары для YML фида Яндекса
  const productsResponse = await getPublicProducts({ limit: 100, sort: "newest" });
  const products = productsResponse?.data ?? [];

  const now = formatDate(new Date());

  const categoriesXml = categories
    .map(
      (c, index) =>
        `      <category id="${index + 1}">${escapeXml(c.name.ru)}</category>`,
    )
    .join("\n");

  const categoryMap = new Map<string, number>();
  categories.forEach((c, idx) => {
    categoryMap.set(c.slug, idx + 1);
  });

  const offersXml = products
    .filter((p) => p.price !== null && Number(p.price) > 0)
    .map((p) => {
      const url = absoluteUrl(`/product/${p.id}`);
      const picture = p.photos?.[0] ? photoUrl(p.photos[0]) : null;
      const desc = markdownToPlainText(p.description ?? "").slice(0, 500);
      const catId = p.categorySlug ? categoryMap.get(p.categorySlug) ?? 1 : 1;

      const brand =
        p.characteristics?.find(
          (c) => c.key.toLowerCase() === "бренд" || c.key.toLowerCase() === "brand",
        )?.value?.trim() || p.shopName;

      return `    <offer id="${p.id}" available="true">
      <url>${escapeXml(url)}</url>
      <price>${Math.round(Number(p.price))}</price>
      <currencyId>UZS</currencyId>
      <categoryId>${catId}</categoryId>
      ${picture ? `<picture>${escapeXml(picture)}</picture>` : ""}
      <name>${escapeXml(p.name)}</name>
      <vendor>${escapeXml(brand)}</vendor>
      <description>${escapeXml(desc || p.name)}</description>
      <store>true</store>
      <pickup>true</pickup>
      <delivery>true</delivery>
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
