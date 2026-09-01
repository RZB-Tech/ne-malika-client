import type { NextConfig } from "next";

/**
 * Заголовки безопасности.
 *
 * Кликджекинг закрыт через frame-ancestors, а не X-Frame-Options: DENY —
 * сайт работает и как Telegram Mini App, а на Telegram Web мини-приложение
 * открывается в iframe. DENY убил бы вход через Telegram в вебе.
 */

/** Origin бэкенда: с него идут и запросы, и картинки товаров. */
function apiOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

const API = apiOrigin();

const TELEGRAM = "https://telegram.org";
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
  // HMR и source maps в dev работают через eval. В прод-сборку не попадает.
  ...(DEV ? ["'unsafe-eval'"] : []),
];

// Webvisor Метрики поднимает свой iframe; вход через Telegram открывается
// popup'ом (window.open), а на него frame-src не распространяется.
const frameSrc = ["'self'", METRIKA];

const connectSrc = [
  "'self'",
  METRIKA,
  YASTATIC,
  SUGGEST,
  API,
  // Канал дозагрузки next dev.
  ...(DEV ? ["ws:", "http://localhost:*"] : []),
].filter(Boolean);

const imgSrc = ["'self'", "data:", "blob:", METRIKA, API].filter(Boolean);

const csp = [
  `default-src 'self'`,
  `script-src ${scriptSrc.join(" ")}`,
  // Tailwind и style={{...}} дают инлайновые стили — без 'unsafe-inline'
  // страница останется без оформления.
  `style-src 'self' 'unsafe-inline'`,
  `img-src ${imgSrc.join(" ")}`,
  // next/font кладёт шрифты Google к себе при сборке, наружу они не ходят.
  `font-src 'self' data:`,
  `connect-src ${connectSrc.join(" ")}`,
  `frame-src ${frameSrc.join(" ")}`,
  `frame-ancestors ${FRAME_ANCESTORS.join(" ")}`,
  // sw.js для пуш-уведомлений.
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: `${csp};` },
  // includeSubDomains намеренно нет: под nemalika.uz живут поддомены, которые
  // этой сборке не видны, и один не переведённый на HTTPS станет недоступен
  // на год вперёд. Добавлять — только проверив их все.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Камеру, микрофон и геолокацию сайт не использует — забираем их у страницы
  // целиком, чтобы их не мог запросить чужой скрипт, если такой сюда попадёт.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*.ngrok-free.dev", "*.ngrok.io", "*.trycloudflare.com"],
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  // Версия фреймворка в ответе нужна только тому, кто подбирает под неё эксплойт.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
