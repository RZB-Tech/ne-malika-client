export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://nemalika.uz").replace(
  /\/+$/,
  "",
);

export const SITE_NAME = "neMalika";

export const SITE_DESCRIPTION =
  "Компьютерный рынок Малика в Ташкенте онлайн: ноутбуки, ПК, комплектующие и IT-услуги. Сравните цены на neMalika и свяжитесь с магазином напрямую.";

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

export function absoluteUrl(path = "/"): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
