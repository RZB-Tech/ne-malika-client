import type { MetadataRoute } from "next";
import { getAllProductIds, getAllShopIds } from "@/lib/api/server";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, shops] = await Promise.all([getAllProductIds(), getAllShopIds()]);

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: absoluteUrl(`/product/${p.id}`),
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const shopEntries: MetadataRoute.Sitemap = shops.map((s) => ({
    url: absoluteUrl(`/store/${s.id}`),
    lastModified: s.updatedAt ? new Date(s.updatedAt) : undefined,
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
    ...shopEntries,
    ...productEntries,
  ];
}
