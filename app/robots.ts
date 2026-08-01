import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Кабинеты и служебные разделы индексировать незачем.
      disallow: [
        "/admin",
        "/seller",
        "/account",
        "/compare",
        "/register",
        "/api/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
