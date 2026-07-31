// Hand-written response shapes for endpoints whose OpenAPI responses ship
// without a schema. They mirror the backend Drizzle rows / service results, so
// we cast the generated hooks' `unknown`/`void` data to these at the app layer.

export type ProductState = "new" | "old";
export type EntityStatus = "active" | "abolished" | "hidden";
export type UserRole = "seller" | "admin";
export type AiVerdict = "pass" | "warn" | "fail";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface WorkScheduleEntry {
  day: "Mo" | "Tu" | "We" | "Th" | "Fr" | "Sa" | "Su";
  start: string;
  end: string;
  isHoliday: boolean;
}

export interface ProductCharacteristic {
  key: string;
  value: string;
}

/** Item of GET /product-cards and GET /product-cards/:id (public projection). */
export interface PublicProductCard {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  photos: string[];
  price: string; // numeric serialized as string
  state: ProductState;
  createdAt: string;
  shopName: string;
  /** Present on the single-item detail projection (GET /product-cards/:id). */
  characteristics?: ProductCharacteristic[] | null;
}

/** Full product row returned in seller cabinet & inside a public shop. */
export interface ProductCardRow {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  photos: string[];
  price: string;
  state: ProductState;
  characteristics: ProductCharacteristic[] | null;
  status: EntityStatus;
  abolishReason: string | null;
  abolishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full shop row (seller cabinet + admin). */
export interface ShopRow {
  id: number;
  owner: number;
  name: string;
  description: string | null;
  photo: string | null;
  telegramLink: string;
  contact: string;
  address: string | null;
  workSchedule: WorkScheduleEntry[] | null;
  location: number[] | null;
  status: EntityStatus;
  abolishReason: string | null;
  abolishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** GET /shops/:id — public shop with its active products. */
export interface PublicShop extends ShopRow {
  productCards: ProductCardRow[];
}

/** GET /admin/shops — магазин + число товаров, одним запросом для админки. */
export interface AdminShopRow {
  id: number;
  name: string;
  photo: string | null;
  telegramLink: string;
  contact: string;
  address: string | null;
  status: EntityStatus;
  abolishReason: string | null;
  createdAt: string;
  productCount: number;
}

export interface AiCheckDetail {
  verdict: AiVerdict;
  notes: string;
}

/** GET /seller/product-cards/:id/ai-check — последняя проверка либо заглушка. */
export interface AiProductCheck {
  id: number;
  productCardId: number;
  verdict: AiVerdict;
  checks: Partial<
    Record<
      "description" | "dataConsistency" | "photos" | "photoMatch",
      AiCheckDetail
    >
  >;
  summary: string | null;
  model: string;
  tokensUsed: number | null;
  error: string | null;
  createdAt: string;
  /** Приходит вместо проверки, когда её ещё не было. */
  message?: string;
}

export interface ReportRow {
  id: number;
  context: string;
  shopId: number;
  productCardId: number | null;
  createdAt: string;
  updatedAt: string;
}
