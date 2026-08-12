
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nemalika.uz"
).replace(/\/+$/, "");

export const SITE_NAME = "neMalika";

export const SITE_DESCRIPTION =
  "neMalika — онлайн-витрина компьютерного рынка Малика (Malika) в Ташкенте: " +
  "ноутбуки, комплектующие, готовые сборки, видеокарты, процессоры и периферия " +
  "от проверенных продавцов рынка. Актуальные цены, поиск и прямая связь с " +
  "магазином в Telegram.";

export const SITE_KEYWORDS = [
  "рынок Малика",
  "Malika Тошкент",
  "Малика Ташкент",
  "компьютерный рынок Ташкент",
  "купить компьютер Ташкент",
  "ноутбуки Ташкент",
  "комплектующие для ПК Ташкент",
  "видеокарты Ташкент",
  "процессоры Ташкент",
  "neMalika",
  "малика компьютеры",
  "kompyuter bozori Malika",
];

/** Абсолютный URL из пути (для canonical, OG, sitemap). */
export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
