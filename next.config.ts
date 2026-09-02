import type { NextConfig } from "next";

/**
 * Заголовки безопасности.
 *
 * Кликджекинг закрыт через frame-ancestors, а не X-Frame-Options: DENY —
 * сайт работает и как Telegram Mini App, а на Telegram Web мини-приложение
 * открывается в iframe. DENY убил бы вход через Telegram в вебе.
 */

function originOf(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/** Origin бэкенда: с него идут и запросы, и картинки товаров. */
const API = originOf(process.env.NEXT_PUBLIC_API_URL);

/**
 * Хранилище — это два разных хоста, и путать их нельзя.
 *
 * Читаются картинки с публичного домена (NEXT_PUBLIC_S3_PUBLIC_BASE) — это
 * img-src. Кладётся файл по presigned-форме из POST /seller/uploads, а её
 * uploadUrl ведёт на сырой эндпоинт бакета — это connect-src. Домен для
 * чтения в connect-src загрузку не спасёт.
 *
 * Значения по умолчанию боевые: список хостов CSP вшивается в сборку и
 * окружением запущенного контейнера уже не правится, так что пустая
 * переменная молча ломала бы прод.
 */
const S3_PUBLIC = originOf(process.env.NEXT_PUBLIC_S3_PUBLIC_BASE) ?? "https://static.nemalika.uz";
const S3_UPLOAD = "https://s3.uz-2.srvstorage.uz";

const TELEGRAM = "https://telegram.org";
/** Аватарки из Telegram-логина: photo_url ведёт на t.me/i/userpic/... */
const TME = "https://t.me";
const METRIKA = "https://mc.yandex.ru";
const YASTATIC = "https://yastatic.net";
const SUGGEST = "https://suggest-maps.yandex.ru";

const FRAME_ANCESTORS = ["'self'", TELEGRAM, "https://*.telegram.org"];

/**
 * script-src держит 'unsafe-inline' сознательно.
 *
 * App Router отдаёт RSC-поток инлайновыми `self.__next_f.push(...)` — их
 * содержимое разное на каждой странице, под хеш не подвести. Остаётся nonce,
 * а он требует middleware и делает рендер динамическим: статические страницы
 * магазинов, собранные под поисковики, при этом развалятся.
 *
 * Поэтому от XSS здесь защищают не script-src, а остальные директивы:
 * object-src отключает плагины, base-uri закрывает подмену <base>,
 * form-action и connect-src не дают увести данные на чужой хост.
 */
const DEV = process.env.NODE_ENV !== "production";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  TELEGRAM,
  METRIKA,
  YASTATIC,
  ...(DEV ? ["'unsafe-eval'"] : []),
];

const frameSrc = ["'self'", METRIKA];

const connectSrc = [
  "'self'",
  METRIKA,
  YASTATIC,
  SUGGEST,
  API,
  S3_UPLOAD,
  ...(DEV ? ["ws:", "http://localhost:*"] : []),
].filter(Boolean);

const imgSrc = ["'self'", "data:", "blob:", METRIKA, API, S3_PUBLIC, TME].filter(Boolean);

const csp = [
  `default-src 'self'`,
  `script-src ${scriptSrc.join(" ")}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${imgSrc.join(" ")}`,
  `font-src 'self' data:`,
  `connect-src ${connectSrc.join(" ")}`,
  `frame-src ${frameSrc.join(" ")}`,
  `frame-ancestors ${FRAME_ANCESTORS.join(" ")}`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: `${csp};` },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok.io", "*.trycloudflare.com"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
