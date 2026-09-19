import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getAllProductIds, getAllShopIds, getPublicCategories } from "@/lib/api/server";
import { absoluteUrl } from "@/lib/seo";

// Generate at request time: API outages must not turn the sitemap into an empty
// successful response or break an image build without backend connectivity.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const [products, shops, categories] = await Promise.all([
    getAllProductIds(),
    getAllShopIds(),
    getPublicCategories(),
  ]);

  // Категории каталога — приоритет 0.9 для индексации запросов «ноутбуки», «видеокарты» и др.
  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/category/${c.slug}`),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/product/${p.id}`),
    lastModified:
      p.updatedAt && Number.isFinite(Date.parse(p.updatedAt)) ? new Date(p.updatedAt) : undefined,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const shopEntries: MetadataRoute.Sitemap = shops.map((s) => ({
    url: absoluteUrl(`/store/${s.id}`),
    lastModified:
      s.updatedAt && Number.isFinite(Date.parse(s.updatedAt)) ? new Date(s.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/stores"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categoryEntries,
    { url: absoluteUrl("/category"), changeFrequency: "weekly", priority: 0.9 },
    ...shopEntries,
    ...productEntries,
  ];
}
