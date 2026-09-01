import "server-only";

import type {
  PublicBannerDto,
  PublicShopListItemDto,
  ShopsControllerFindAllSort,
} from "./generated/schemas";
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
  revalidateSec > 0 ? { next: { revalidate: revalidateSec } } : { cache: "no-store" as const };

async function getJson<T>(path: string, revalidateSec: number): Promise<T | null> {
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

async function getEntityJson<T>(path: string, revalidateSec: number): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    ...fetchOpts(revalidateSec),
    headers: { accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

export function getPublicProduct(id: number): Promise<PublicProductCard | null> {
  return getEntityJson<PublicProductCard>(`/product-cards/${id}`, 300);
}

export function getPublicShop(id: number): Promise<PublicShop | null> {
  return getEntityJson<PublicShop>(`/shops/${id}`, 600);
}

export function getPublicProducts(
  params: {
    page?: number;
    limit?: number;
    sort?: string;
    seed?: string;
    shopId?: number;
    categoryId?: number;
  } = {},
): Promise<Paginated<PublicProductCard> | null> {
  const { page = 1, limit = 24, sort = "newest", seed, shopId, categoryId } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
    ...(seed ? { seed } : {}),
    ...(shopId ? { shop_id: String(shopId) } : {}),
    ...(categoryId ? { category_id: String(categoryId) } : {}),
  }).toString();
  return getJson<Paginated<PublicProductCard>>(`/product-cards?${qs}`, seed ? 0 : 120);
}

export async function getBanners(): Promise<PublicBannerDto[]> {
  return (await getJson<PublicBannerDto[]>("/banners", 120)) ?? [];
}

export async function getAllProductIds(): Promise<{ id: number; updatedAt: string }[]> {
  return (await getJson<{ id: number; updatedAt: string }[]>("/product-cards/sitemap", 3600)) ?? [];
}

export function getPublicShops(
  params: { page?: number; limit?: number; q?: string; sort?: ShopsControllerFindAllSort } = {},
): Promise<Paginated<PublicShopListItemDto> | null> {
  const { page = 1, limit = 24, q, sort = "products" } = params;
  const qs = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sort,
    ...(q ? { q } : {}),
  }).toString();
  return getJson<Paginated<PublicShopListItemDto>>(`/shops?${qs}`, 300);
}

export async function getAllShopIds(): Promise<{ id: number; updatedAt: string }[]> {
  return (await getJson<{ id: number; updatedAt: string }[]>("/shops/sitemap", 3600)) ?? [];
}
