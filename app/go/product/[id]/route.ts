import { NextResponse, type NextRequest } from "next/server";

import { getPublicProduct, getPublicShop } from "@/lib/api/server";
import { buildTelegramUrl, parseTelegramUsername } from "@/lib/telegram";
import { messages } from "@/lib/i18n/messages";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

/**
 * «Связаться с продавцом» прямо из карточки в каталоге.
 *
 * Публичная выдача товаров не содержит телеграма магазина — только shopId, так
 * что собрать ссылку на клиенте нечем. Догружать магазин по клику нельзя:
 * `window.open` после await блокируется браузером. Поэтому кнопка — обычная
 * ссылка сюда, а адрес диалога подставляет сервер редиректом.
 *
 * Язык приезжает параметром `l`: приветствие берётся из того же каталога
 * сообщений, что и на клиенте.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const productId = Number(id);
  const fallback = new URL(`/product/${id}`, req.url);

  if (!Number.isInteger(productId) || productId <= 0)
    return NextResponse.redirect(new URL("/", req.url));

  const product = await getPublicProduct(productId);
  if (!product) return NextResponse.redirect(fallback);

  const shop = await getPublicShop(product.shopId);
  const username = shop ? parseTelegramUsername(shop.telegramLink) : null;
  // Телеграма у магазина нет (или бэкенд молчит) — открываем карточку: там
  // остаётся телефон и ссылка на магазин.
  if (!username) return NextResponse.redirect(fallback);

  const raw = req.nextUrl.searchParams.get("l");
  const locale: Locale = locales.includes(raw as Locale)
    ? (raw as Locale)
    : defaultLocale;

  return NextResponse.redirect(
    buildTelegramUrl(username, {
      productName: product.name,
      productId: String(product.id),
      greeting: messages[locale].product.telegramGreeting,
    }),
  );
}
