import type { NextConfig } from "next";
import { imageRemotePatterns } from "./lib/image-config";

/**
 * Заголовки безопасности.
 *
 * Основное внимание — frame-ancestors, так как X-Frame-Options: DENY сломал
 * бы работу в Telegram Mini App, если Telegram Web захочет открыть нас
 * внутри iframe. DENY убрали бы доступ к Telegram и т.д.
 * Также разрешаем домены Яндекс Метрики / Вебвизора для отображения записей
 * и тепловых карт в личном кабинете Метрики.
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

/** Origin бэкенда: в проде свой и в dev/staging свой. */
const API = originOf(process.env.NEXT_PUBLIC_API_URL);

/**
 * Публичный URL для раздачи статики: фото, видео и т.д.
 *
 * В проде свой и в dev/staging свой (NEXT_PUBLIC_S3_PUBLIC_BASE) — это
 * img-src. Загрузка фото идет presigned-урлами из POST /seller/uploads, и их
 * uploadUrl указывает на бакет напрямую — для этого connect-src. Базовый origin
 * S3_UPLOAD в connect-src добавлен на всякий случай.
 */
const S3_PUBLIC = originOf(process.env.NEXT_PUBLIC_S3_PUBLIC_BASE) ?? "https://static.nemalika.uz";
const S3_UPLOAD = "https://s3.uz-2.srvstorage.uz";

const TELEGRAM = "https://telegram.org";
/** Аватары в Telegram-виджете: photo_url указывает на t.me/i/userpic/..., который отдаёт 302-редирект на CDN telesco.pe */
const TME = "https://t.me";
const TELEGRAM_CDN = [
  "https://*.telesco.pe",
  "https://telesco.pe",
  "https://*.telegram.org",
  "https://*.cdn-telegram.org",
  "https://cdn-telegram.org",
];

/**
 * Домены Яндекс Метрики (включая Вебвизор, клик-карты и региональные CDN)
 * и Геосаджеста Яндекс Карт.
 */
const YANDEX_DOMAINS = [
  "https://mc.yandex.ru",
  "https://*.yandex.ru",
  "https://yandex.ru",
  "https://mc.yandex.uz",
  "https://*.yandex.uz",
  "https://yandex.uz",
  "https://mc.yandex.md",
  "https://*.yandex.md",
  "https://yandex.md",
  "https://mc.yandex.kz",
  "https://*.yandex.kz",
  "https://yandex.kz",
  "https://mc.yandex.by",
  "https://*.yandex.by",
  "https://yandex.by",
  "https://mc.yandex.com",
  "https://*.yandex.com",
  "https://yandex.com",
  "https://mc.yandex.tj",
  "https://*.yandex.tj",
  "https://yandex.tj",
  "https://mc.yandex.az",
  "https://*.yandex.az",
  "https://yandex.az",
  "https://*.yastatic.net",
  "https://yastatic.net",
  "https://*.webvisor.com",
  "https://webvisor.com",
  "https://*.webvisor.org",
  "https://webvisor.org",
  "https://suggest-maps.yandex.ru",
];

/**
 * WebSocket-соединения Яндекс Вебвизора (solid.ws и стриминг сессий).
 */
const YANDEX_WS = [
  "wss://mc.yandex.ru",
  "wss://*.yandex.ru",
  "wss://*.yandex.uz",
  "wss://*.yandex.md",
  "wss://*.yandex.kz",
  "wss://*.yandex.by",
  "wss://*.yandex.com",
  "wss://*.webvisor.com",
  "wss://*.webvisor.org",
];

/**
 * Домены для просмотра записей Вебвизора и тепловых карт в кабинете Яндекс Метрики.
 */
const YANDEX_ANCESTORS = [
  "https://metrika.yandex.ru",
  "https://*.yandex.ru",
  "https://metrika.yandex.uz",
  "https://*.yandex.uz",
  "https://*.yandex.by",
  "https://*.yandex.kz",
  "https://*.yandex.com",
  "https://webvisor.com",
  "https://*.webvisor.com",
];

const FRAME_ANCESTORS = ["'self'", TELEGRAM, "https://*.telegram.org", ...YANDEX_ANCESTORS];

/**
 * script-src пока с 'unsafe-inline' вынужденно.
 *
 * App Router вставляет RSC-пейлоады скриптом `self.__next_f.push(...)` — их
 * десятки штук на каждый переход, часть генерируются на лету. В теории можно nonce,
 * но для этого нужен middleware и потеря full static opt: динамические
 * страницы, запросы к БД каждый раз, что для каталога накладно.
 *
 * Защита от XSS здесь будет через строгие:
 * object-src отсекает плагины, base-uri режет подмену <base>,
 * form-action и connect-src не дают слать данные на чужие хосты.
 */
const DEV = process.env.NODE_ENV !== "production";

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  TELEGRAM,
  ...YANDEX_DOMAINS,
  ...(DEV ? ["'unsafe-eval'"] : []),
];

const frameSrc = ["'self'", "blob:", ...YANDEX_DOMAINS];

const connectSrc = [
  "'self'",
  ...YANDEX_DOMAINS,
  ...YANDEX_WS,
  API,
  S3_UPLOAD,
  ...(DEV ? ["ws:", "http://localhost:*"] : []),
].filter(Boolean);

const imgSrc = [
  "'self'",
  "data:",
  "blob:",
  ...YANDEX_DOMAINS,
  API,
  S3_PUBLIC,
  TME,
  ...TELEGRAM_CDN,
].filter(Boolean);

const csp = [
  `default-src 'self'`,
  `script-src ${Array.from(new Set(scriptSrc)).join(" ")}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${Array.from(new Set(imgSrc)).join(" ")}`,
  `font-src 'self' data:`,
  `connect-src ${Array.from(new Set(connectSrc)).join(" ")}`,
  `frame-src ${Array.from(new Set(frameSrc)).join(" ")}`,
  `frame-ancestors ${Array.from(new Set(FRAME_ANCESTORS)).join(" ")}`,
  `child-src 'self' blob: ${Array.from(new Set(YANDEX_DOMAINS)).join(" ")}`,
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
  images: {
    remotePatterns: imageRemotePatterns,
    formats: ["image/webp"],
    minimumCacheTTL: 86400,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
