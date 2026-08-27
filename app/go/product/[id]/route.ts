import { NextResponse, type NextRequest } from "next/server";

import { getPublicProduct, getPublicShop } from "@/lib/api/server";
import { buildTelegramUrl, parseTelegramUsername } from "@/lib/telegram";
import { loadMessages } from "@/lib/i18n/messages";
import { defaultLocale, locales, type Locale } from "@/lib/i18n/config";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = Number(id);
  const fallback = new URL(`/product/${id}`, req.url);

  if (!Number.isInteger(productId) || productId <= 0)
    return NextResponse.redirect(new URL("/", req.url));

  const product = await getPublicProduct(productId);
  if (!product) return NextResponse.redirect(fallback);

  const shop = await getPublicShop(product.shopId);
  const username = shop ? parseTelegramUsername(shop.telegramLink) : null;
  if (!username) return NextResponse.redirect(fallback);

  const raw = req.nextUrl.searchParams.get("l");
  const locale: Locale = locales.includes(raw as Locale) ? (raw as Locale) : defaultLocale;
  const dict = await loadMessages(locale);

  return NextResponse.redirect(
    buildTelegramUrl(username, {
      productName: product.name,
      productId: String(product.id),
      greeting: dict.product.telegramGreeting,
    }),
  );
}
