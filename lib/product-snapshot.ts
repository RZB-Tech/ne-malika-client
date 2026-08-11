// Снимок карточки товара для личных списков покупателя.
//
// Списки (история, избранное, сравнение) хранят его целиком, а не один id:
// панель сравнения и кабинет должны рисоваться сразу, без похода в API за
// названиями и ценами. Полные характеристики подтягиваются только там, где они
// действительно нужны, — в таблице сравнения.

import type { PublicProductCard } from "@/lib/api/types";
import type { Product } from "@/lib/data";

export interface ProductSnapshot {
  id: number;
  shopId: number;
  shopName: string;
  name: string;
  /** numeric с бэкенда приходит строкой — храним как есть. null — договорная. */
  price: string | null;
  /** Ключ файла в S3, не готовый URL: адрес прокси может измениться. */
  photo: string | null;
  state: "new" | "old";
}

export function isProductSnapshot(value: unknown): value is ProductSnapshot {
  const v = value as Partial<ProductSnapshot> | null;
  return (
    typeof v === "object" &&
    v !== null &&
    typeof v.id === "number" &&
    typeof v.name === "string"
  );
}

/**
 * Отображаемый товар → снимок. `brand` у карточек с бэкенда — это название
 * магазина (см. mappers.toProduct), поэтому оно и едет в `shopName`.
 */
export function productToSnapshot(product: Product): ProductSnapshot {
  return {
    id: Number(product.id),
    shopId: Number(product.storeId),
    shopName: product.brand,
    name: product.name,
    price: product.price === null ? null : String(product.price),
    photo: product.photoKeys?.[0] ?? null,
    state: product.isNew ? "new" : "old",
  };
}

/**
 * Снимок → публичная проекция товара, чтобы список рисовался тем же
 * `ProductCard`, что и витрина. Полей, которых в снимке нет, у карточки на
 * витрине всё равно не видно.
 */
export function snapshotToPublicCard(
  snapshot: ProductSnapshot,
  createdAt: string,
): PublicProductCard {
  return {
    id: snapshot.id,
    shopId: snapshot.shopId,
    shopName: snapshot.shopName,
    name: snapshot.name,
    description: null,
    photos: snapshot.photo ? [snapshot.photo] : [],
    price: snapshot.price,
    state: snapshot.state,
    createdAt,
    characteristics: null,
  };
}
