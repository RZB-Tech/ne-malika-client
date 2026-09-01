import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — компьютерный рынок Малика в Ташкенте`,
    short_name: SITE_NAME,
    description:
      "Витрина компьютерного рынка Малика: ноутбуки, комплектующие, готовые сборки " +
      "и периферия от продавцов рынка. Поиск, сравнение и связь с магазином напрямую.",
    lang: "ru",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fa",
    theme_color: "#245ae5",
    categories: ["shopping", "business"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Отдельная маска: систему интересует не скруглённая иконка, а полотно,
      // которое она обрежет по своей форме — логотип в нём отступает от краёв.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Избранное", url: "/account?tab=favorites" },
      { name: "Сравнение", url: "/compare" },
      { name: "Сообщения", url: "/messages" },
    ],
  };
}
