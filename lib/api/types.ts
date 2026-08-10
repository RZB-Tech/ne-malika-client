// Hand-written response shapes for endpoints whose OpenAPI responses ship
// without a schema. They mirror the backend Drizzle rows / service results, so
// we cast the generated hooks' `unknown`/`void` data to these at the app layer.

export type ProductState = "new" | "old";
/** `pending` — товар ждёт ИИ-проверку и в публичную выдачу ещё не попал. */
export type EntityStatus = "active" | "abolished" | "hidden" | "pending";
/** `user` — покупатель; продавцом становятся, создав магазин. */
export type UserRole = "user" | "seller" | "admin";
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

/** GET /admin/product-cards — товар со статусом модерации, все статусы. */
export interface AdminProductRow extends PublicProductCard {
  status: EntityStatus;
  abolishReason: string | null;
  abolishedAt: string | null;
  updatedAt: string;
  shopStatus: EntityStatus;
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
  /** Владелец магазина: блокируется отдельно от самого магазина. */
  ownerId: number;
  ownerName: string;
  ownerUsername: string | null;
  ownerBlockedAt: string | null;
  ownerBlockReason: string | null;
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

/** GET /admin/users — пользователь, его магазин и активность. */
export interface AdminUserRow {
  id: number;
  fullname: string;
  role: UserRole;
  telegramId: number;
  telegramUsername: string | null;
  telegramPhoto: string | null;
  phoneNumber: string | null;
  blockedAt: string | null;
  blockReason: string | null;
  createdAt: string;
  shopId: number | null;
  shopName: string | null;
  shopStatus: EntityStatus | null;
  productCount: number;
  lastProductAt: string | null;
}

/** Товар из «недавних действий» пользователя. */
export interface AdminUserActivity {
  id: number;
  name: string;
  status: EntityStatus;
  price: string;
  createdAt: string;
  updatedAt: string;
  shopName: string;
}

/** GET /admin/users/:id */
export interface AdminUserDetail extends AdminUserRow {
  recentProducts: AdminUserActivity[];
}

/** GET /admin/product-cards/ai-review — очередь ручной модерации. */
export interface AiReviewRow {
  checkId: number;
  productCardId: number;
  verdict: AiVerdict;
  summary: string | null;
  error: string | null;
  checkedAt: string;
  name: string;
  price: string;
  photos: string[];
  status: EntityStatus;
  description: string | null;
  shopName: string;
}

export interface ReportRow {
  id: number;
  context: string;
  shopId: number;
  productCardId: number | null;
  createdAt: string;
  updatedAt: string;
}
