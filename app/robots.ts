import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/seller", "/api/", "/go/"],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: ["/admin", "/seller", "/api/", "/go/"],
        other: {
          "Clean-param": ["seed /", "visitor_id /"],
        },
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
