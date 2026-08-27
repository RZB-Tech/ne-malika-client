import type { PublicProductCard } from "@/lib/api/types";
import type { Product } from "@/lib/data";

export interface ProductSnapshot {
  id: number;
  shopId: number;
  shopName: string;
  name: string;
  price: string | null;
  photo: string | null;
  state: "new" | "old";
}

export function isProductSnapshot(value: unknown): value is ProductSnapshot {
  const v = value as Partial<ProductSnapshot> | null;
  return (
    typeof v === "object" && v !== null && typeof v.id === "number" && typeof v.name === "string"
  );
}

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
