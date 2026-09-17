import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/seller", "/account", "/compare", "/register", "/api/"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin", "/seller", "/account", "/compare", "/register", "/api/"],
        other: {
          "Clean-param": ["seed /", "visitor_id /"],
        },
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
