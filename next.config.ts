import type { NextConfig } from "next";

/**
 * Заголовки безопасности.
 *
 * Кликджекинг закрыт через frame-ancestors, а не X-Frame-Options: DENY —
 * сайт работает и как Telegram Mini App, а на Telegram Web мини-приложение
 * открывается в iframe. DENY убил бы вход через Telegram в вебе.
 *
 * Полноценного CSP здесь намеренно нет: на странице два инлайновых скрипта
 * (переключатель темы в app/layout.tsx и тег Метрики), поэтому script-src
 * потребует nonce — отдельная работа. Директива frame-ancestors от этого не
 * зависит и работает сама по себе.
 */
const FRAME_ANCESTORS = [
  "'self'",
  "https://telegram.org",
  "https://*.telegram.org",
].join(" ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: `frame-ancestors ${FRAME_ANCESTORS};` },
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
