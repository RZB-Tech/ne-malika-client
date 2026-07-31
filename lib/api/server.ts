// Серверные (RSC / generateMetadata / sitemap) обёртки над публичным API.
// НЕ используют axios-мьютатор из mutator.ts — тот несёт браузерный token-store
// и интерцепторы; здесь нужен голый fetch без авторизации, только публичные
// проекции товаров и магазинов.
//
// Внутри docker-сети фронтенд может ходить в бэкенд напрямую по имени сервиса
// (API_INTERNAL_URL, напр. http://api:3000) — быстрее и не гоняет трафик через
// публичный TLS. Если переменная не задана, падаем на публичный адрес.
import "server-only";

import type { PublicProductCard, PublicShop, Paginated } from "./types";

const ORIGIN = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"
)
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

const API = `${ORIGIN}/api/v1`;

async function getJson<T>(
  path: string,
  revalidateSec: number,
): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      // ISR: страница кешируется и переиспользуется краулерами, БД не долбим.
      next: { revalidate: revalidateSec },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    // Сеть/бэкенд недоступны — вызывающий код решает (notFound / дефолт).
    return null;
  }
}

/** GET /product-cards/:id — публичная карточка товара. */
export function getPublicProduct(
  id: number,
): Promise<PublicProductCard | null> {
  return getJson<PublicProductCard>(`/product-cards/${id}`, 300);
}

/** GET /shops/:id — публичный магазин. */
export function getPublicShop(id: number): Promise<PublicShop | null> {
  return getJson<PublicShop>(`/shops/${id}`, 600);
}

/**
 * GET /product-cards?... — страница каталога для серверного рендера витрины.
 * Значения по умолчанию совпадают с первым запросом CatalogView (page 1,
 * limit 24, sort newest, без фильтров), чтобы initialData подошёл под ключ
 * react-query и гидратация не разошлась.
 */
export function getPublicProducts(
  params: { page?: number; limit?: number; sort?: string } = {},
): Promise<Paginated<PublicProductCard> | null> {
  const { page = 1, limit = 24, sort = "newest" } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
  }).toString();
  return getJson<Paginated<PublicProductCard>>(`/product-cards?${qs}`, 120);
}

/**
 * Все id товаров для sitemap. Один запрос к специальному эндпоинту: раньше
 * здесь была последовательная пагинация до сотни запросов подряд.
 */
export async function getAllProductIds(): Promise<
  { id: number; updatedAt: string }[]
> {
  return (
    (await getJson<{ id: number; updatedAt: string }[]>(
      "/product-cards/sitemap",
      3600,
    )) ?? []
  );
}
