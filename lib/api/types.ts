export type ProductState = "new" | "old";
export type EntityStatus = "active" | "abolished" | "hidden" | "pending";
export type UserRole = "user" | "seller" | "admin";
export type AiVerdict = "pass" | "warn" | "fail";
export type ReviewStatus = "pending" | "approved" | "rejected";

export type SubscriptionPlan = "free" | "start" | "pro" | "max";

export type PaidPlan = Exclude<SubscriptionPlan, "free">;

export type BannerModerationStatus = "pending" | "approved" | "rejected";

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

export interface PublicProductCard {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  photos: string[];
  price: string | null;
  state: ProductState;
  createdAt: string;
  shopName: string;
  ratingAvg?: number;
  ratingCount?: number;
  characteristics?: ProductCharacteristic[] | null;
  categoryId?: number | null;
  categorySlug?: string | null;
  categoryNameRu?: string | null;
  categoryNameUzLatn?: string | null;
  categoryNameUzCyrl?: string | null;
}

export interface ProductCardRow {
  id: number;
  shopId: number;
  name: string;
  description: string | null;
  photos: string[];
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

export interface AdminProductRow extends PublicProductCard {
  status: EntityStatus;
  abolishReason: string | null;
  abolishedAt: string | null;
  updatedAt: string;
  shopStatus: EntityStatus;
}

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
  ratingAvg?: number;
  ratingCount?: number;
  restrictedCategoriesEnabled: boolean;
  status: EntityStatus;
  abolishReason: string | null;
  abolishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Публичная карточка магазина отдаёт не всю строку: баланс кредитов, тариф и
 * расход автозаполнений с неё сняты, поэтому от ShopRow она не наследуется.
 */
export interface PublicShopRow {
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
  ratingAvg?: number;
  ratingCount?: number;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PublicShop extends PublicShopRow {
  productCards: ProductCardRow[];
}

export interface AdminShopRow {
  id: number;
  name: string;
  photo: string | null;
  telegramLink: string;
  contact: string;
  address: string | null;
  status: EntityStatus;
  abolishReason: string | null;
  restrictedCategoriesEnabled: boolean;
  createdAt: string;
  productCount: number;
  ownerId: number;
  ownerName: string;
  ownerUsername: string | null;
  ownerBlockedAt: string | null;
  ownerBlockReason: string | null;
}

export interface AdminSubscriptionRow {
  shopId: number;
  shopName: string;
  shopStatus: EntityStatus;
  ownerId: number;
  ownerName: string;
  ownerUsername: string | null;
  plan: SubscriptionPlan;
  storedPlan: SubscriptionPlan;
  active: boolean;
  until: string | null;
  daysLeft: number | null;
  creditsBalance?: number;
  subscriptionCredits: number;
  lastPaidAt: string | null;
  stuckPrepared: boolean;
  needsManualReview: boolean;
}

export interface AiUsageRow {
  id: number;
  operation: "prompt" | "description" | "image" | "autofill" | "banner";
  model: string | null;
  images: number;
  usd: number | null;
  credits: number;
  free?: boolean;
  estimated: boolean;
  createdAt: string;
  userId: number | null;
  userName: string | null;
  userUsername: string | null;
  userRole: UserRole | null;
  shopId: number | null;
  shopName: string | null;
}

export interface AiUsageTotals {
  requests: number;
  images: number;
  usd: number;
  credits: number;
  freeRequests: number;
  freeUsd: number;
  platformRequests: number;
  platformUsd: number;
}

export interface AiCheckDetail {
  verdict: AiVerdict;
  notes: string;
}

export interface AiProductCheck {
  id: number;
  productCardId: number;
  verdict: AiVerdict;
  checks: Partial<
    Record<"description" | "dataConsistency" | "photos" | "photoMatch", AiCheckDetail>
  >;
  summary: string | null;
  model: string;
  tokensUsed: number | null;
  error: string | null;
  createdAt: string;
  message?: string;
}

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
  creditsBalance: number | null;
  creditsReserved: number | null;
  productCount: number;
  lastProductAt: string | null;
}

export interface AdminUserActivity {
  id: number;
  name: string;
  status: EntityStatus;
  price: string | null;
  createdAt: string;
  updatedAt: string;
  shopName: string;
}

export interface AdminUserDetail extends AdminUserRow {
  recentProducts: AdminUserActivity[];
}

export interface AiReviewRow {
  checkId: number;
  productCardId: number;
  verdict: AiVerdict;
  summary: string | null;
  error: string | null;
  checkedAt: string;
  name: string;
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

export interface PublicReview {
  id: number;
  rating: number;
  text: string | null;
  createdAt: string;
  shopId: number;
  productCardId: number | null;
  productName: string | null;
  authorName: string;
  authorPhoto: string | null;
}

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

export interface AdminReview extends OwnReview {
  authorId: number;
  authorName: string;
  authorPhoto: string | null;
  moderatedAt: string | null;
  moderatedBy: number | null;
  aiVerdict: AiVerdict | null;
  aiNote: string | null;
}

export interface ReviewSummary {
  count: number;
  average: number;
  breakdown: Record<string, number>;
}

export interface ReviewStatusCounts {
  pending: number;
  approved: number;
  rejected: number;
}
