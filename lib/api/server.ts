import "server-only";

import type { PublicBannerDto } from "./generated/schemas";
import type { PublicProductCard, PublicShop, Paginated } from "./types";

const ORIGIN = (
  process.env.API_INTERNAL_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:3001"
)
  .replace(/\/+$/, "")
  .replace(/\/api\/v1$/, "");

const API = `${ORIGIN}/api/v1`;

const fetchOpts = (revalidateSec: number) =>
  /**
   * Ноль — ответ у каждого захода свой (перемешанная витрина), и класть его
   * в кэш незачем: второй раз по тому же адресу никто не придёт, а место
   * в кэше он занял бы наравне с общими ответами.
   */
  revalidateSec > 0
    ? { next: { revalidate: revalidateSec } }
    : { cache: "no-store" as const };

async function getJson<T>(
  path: string,
  revalidateSec: number,
): Promise<T | null> {
  try {
    const res = await fetch(`${API}${path}`, {
      ...fetchOpts(revalidateSec),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Как getJson, но null только для честной 404. Сетевые сбои и 5xx бросаются:
 * витринная страница товара/магазина не должна превращать временный сбой API
 * в постоянный notFound() — для живого URL это вылет из поискового индекса.
 */
async function getEntityJson<T>(
  path: string,
  revalidateSec: number,
): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    ...fetchOpts(revalidateSec),
    headers: { accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** GET /product-cards/:id — публичная карточка товара. */
export function getPublicProduct(
  id: number,
): Promise<PublicProductCard | null> {
  return getEntityJson<PublicProductCard>(`/product-cards/${id}`, 300);
}

/** GET /shops/:id — публичный магазин. */
export function getPublicShop(id: number): Promise<PublicShop | null> {
  return getEntityJson<PublicShop>(`/shops/${id}`, 600);
}

/**
 * GET /product-cards?... — страница каталога для серверного рендера витрины.
 * Значения по умолчанию совпадают с первым запросом CatalogView (page 1,
 * limit 24, без фильтров), чтобы initialData подошёл под ключ react-query и
 * гидратация не разошлась.
 *
 * `seed` — зерно перемешивания: с ним ответ уникален для захода, поэтому мимо
 * кэша. Без него — прежний общий ответ на две минуты.
 *
 * `visitor_id` отсюда не уходит и уйти не может: он лежит в localStorage
 * посетителя (`lib/analytics.ts`), а этот запрос делает сервер. Статистику
 * поисковых запросов это не обедняет — здесь всегда первая страница витрины
 * без строки поиска, а всё, что человек ищет руками, уходит уже клиентским
 * запросом, и вот к нему `visitor_id` приложить обязательно: без него сервер
 * не считает поисковый запрос вовсе, и отчёт MAX останется пустым.
 */
export function getPublicProducts(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    seed?: string;
  } = {},
): Promise<Paginated<PublicProductCard> | null> {
  const { page = 1, limit = 24, sort = "newest", seed } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
    ...(seed ? { seed } : {}),
  }).toString();
  return getJson<Paginated<PublicProductCard>>(
    `/product-cards?${qs}`,
    seed ? 0 : 120,
  );
}

/**
 * GET /banners — карусель главной. Рендерится сервером вместе с первым экраном:
 * баннер стоит выше каталога и, догружаясь на клиенте, сдвигал бы витрину вниз
 * уже после того, как её увидели.
 *
 * Именно `PublicBannerDto`, а не `BannerDto`: с появлением баннеров продавцов
 * ручка перестала отдавать поля модерации (`status`, `rejectReason`, `shopId`,
 * `isActive`, `sortOrder`) — это переписка продавца с модератором, и на
 * витрине ей не место. Тип здесь написан руками, генератор этот путь не
 * видит, так что соврать он может молча: за списком полей следить глазами.
 */
export async function getBanners(): Promise<PublicBannerDto[]> {
  return (await getJson<PublicBannerDto[]>("/banners", 120)) ?? [];
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
