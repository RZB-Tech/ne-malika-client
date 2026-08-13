export type ProductState = "new" | "old";
/** `pending` — товар ждёт ИИ-проверку и в публичную выдачу ещё не попал. */
export type EntityStatus = "active" | "abolished" | "hidden" | "pending";
/** `user` — покупатель; продавцом становятся, создав магазин. */
export type UserRole = "user" | "seller" | "admin";
export type AiVerdict = "pass" | "warn" | "fail";
/** `pending` — отзыв написан, но до проверки его не видно и в оценке он не участвует. */
export type ReviewStatus = "pending" | "approved" | "rejected";

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
  /** null — «цена договорная»: продавец не назвал сумму. */
  price: string | null;
  state: ProductState;
  createdAt: string;
  shopName: string;
  /**
   * Оценка по опубликованным отзывам. Необязательные: сохранённые ответы и
   * фикстуры собраны до появления отзывов.
   */
  ratingAvg?: number;
  ratingCount?: number;
  /** Present on the single-item detail projection (GET /product-cards/:id). */
  characteristics?: ProductCharacteristic[] | null;
  /**
   * Категория появилась позже фикстур и части сохранённых ответов, поэтому
   * поля необязательные — как и characteristics выше.
   */
  categoryId?: number | null;
  /** Slug листа каталога; до корня клиент доходит по своему дереву категорий. */
  categorySlug?: string | null;
  categoryNameRu?: string | null;
  categoryNameUzLatn?: string | null;
  categoryNameUzCyrl?: string | null;
}

/** Full product row returned in seller cabinet & inside a public shop. */
export interface ProductCardRow {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  photos: string[];
  /** null — «цена договорная»: продавец не назвал сумму. */
  price: string | null;
  state: ProductState;
  characteristics: ProductCharacteristic[] | null;
  categoryId?: number | null;
  ratingAvg?: number;
  ratingCount?: number;
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
  /** Оценка продавца — по отзывам о магазине и обо всех его товарах. */
  ratingAvg?: number;
  ratingCount?: number;
  /** Разрешение выкладывать товары в закрытые разделы каталога. */
  restrictedCategoriesEnabled: boolean;
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
  /** Разрешение выкладывать товары в закрытые разделы каталога. */
  restrictedCategoriesEnabled: boolean;
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
  /** Кредиты магазина. null — магазина нет, тратить не с чего. */
  creditsBalance: number | null;
  creditsReserved: number | null;
  productCount: number;
  lastProductAt: string | null;
}

/** Товар из «недавних действий» пользователя. */
export interface AdminUserActivity {
  id: number;
  name: string;
  status: EntityStatus;
  /** null — «цена договорная»: продавец не назвал сумму. */
  price: string | null;
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
  /** null — «цена договорная»: продавец не назвал сумму. */
  price: string | null;
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

/** GET /reviews — опубликованный отзыв на витрине. */
export interface PublicReview {
  id: number;
  rating: number;
  text: string | null;
  createdAt: string;
  shopId: number;
  /** Пусто — отзыв о магазине целиком. */
  productCardId: number | null;
  productName: string | null;
  /** Имя и первая буква фамилии: отзывы читают посторонние. */
  authorName: string;
  authorPhoto: string | null;
}

/** GET /reviews/mine — свой отзыв целиком, вместе с решением модератора. */
export interface OwnReview {
  id: number;
  rating: number;
  text: string | null;
  status: ReviewStatus;
  moderationNote: string | null;
  createdAt: string;
  shopId: number;
  productCardId: number | null;
  shopName: string;
  productName: string | null;
}

/** GET /admin/reviews — то же плюс автор: модератору видно, кто написал. */
export interface AdminReview extends OwnReview {
  authorId: number;
  authorName: string;
  authorPhoto: string | null;
  moderatedAt: string | null;
  /** null у решений ИИ: живого модератора за ними не было. */
  moderatedBy: number | null;
  /** Решение ИИ-модератора. null — проверка не отработала. */
  aiVerdict: AiVerdict | null;
  aiNote: string | null;
}

/** GET /reviews/summary — средняя оценка и сколько отзывов на каждую звезду. */
export interface ReviewSummary {
  count: number;
  average: number;
  /** Ключи «1»…«5». */
  breakdown: Record<string, number>;
}

/** GET /admin/reviews/stats — счётчики очереди модерации. */
export interface ReviewStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}
