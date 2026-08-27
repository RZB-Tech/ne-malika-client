export type ProductState = "new" | "old";
/** `pending` — товар ждёт ИИ-проверку и в публичную выдачу ещё не попал. */
export type EntityStatus = "active" | "abolished" | "hidden" | "pending";
/** `user` — покупатель; продавцом становятся, создав магазин. */
export type UserRole = "user" | "seller" | "admin";
export type AiVerdict = "pass" | "warn" | "fail";
/** `pending` — отзыв написан, но до проверки его не видно и в оценке он не участвует. */
export type ReviewStatus = "pending" | "approved" | "rejected";

/**
 * Тариф подписки магазина.
 *
 * `free` не продаётся: это состояние «подписки нет» — и у магазина, который
 * никогда не платил, и у того, чей срок вышел. Сервер отдаёт в полях `plan`
 * именно ДЕЙСТВУЮЩИЙ тариф, посчитанный по сроку; колонка `shops.subscription_plan`
 * после истечения намеренно хранит купленный когда-то `max`, и читать её
 * вместо `plan` нельзя — на этом стоят все гейты (автозаполнение, баннер,
 * аналитика).
 */
export type SubscriptionPlan = "free" | "start" | "pro" | "max";

/** Тарифы, которые можно купить: то, что уходит на кассу. */
export type PaidPlan = Exclude<SubscriptionPlan, "free">;

/**
 * Модерация баннера продавца.
 *
 * Имя не `ModerationStatus`: оно занято в `lib/data.ts` другим набором
 * (`draft|moderation|published|rejected`) — тот про товар, и значения не
 * пересекаются. Отсюда же отдельный `BannerStatusBadge` в
 * `components/shared/badges.tsx`.
 */
export type BannerModerationStatus = "pending" | "approved" | "rejected";

/**
 * Состояние платежа за подписку.
 *
 * `prepared` — касса открыта, подтверждения от провайдера ещё не было: денег
 * там нет, Prepare ничего не списывает. `failed` — списание прошло, а выдать
 * подписку не удалось; такие строки ждут разбора человеком.
 */
export type SubscriptionPaymentStatus =
  | "pending"
  | "prepared"
  | "paid"
  | "cancelled"
  | "failed";

/** `manual` — подписку выдал администратор руками, денег через кассу не было. */
export type PaymentProvider = "click" | "payme" | "manual";

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

/** GET /admin/subscriptions — строка таблицы подписок в админке. */
export interface AdminSubscriptionRow {
  shopId: number;
  shopName: string;
  /** Статус самого магазина: упразднённый попадает в список наравне с живым. */
  shopStatus: EntityStatus;
  ownerId: number;
  ownerName: string;
  ownerUsername: string | null;
  /** ДЕЙСТВУЮЩИЙ тариф: у просроченной подписки здесь `free`. */
  plan: SubscriptionPlan;
  /**
   * Тариф, записанный в магазине. После истечения остаётся прежним — по нему
   * видно, чем магазин пользовался, пока платил. Для гейтов не годится.
   */
  storedPlan: SubscriptionPlan;
  active: boolean;
  /** До какого момента оплачено. null — не платили ни разу. */
  until: string | null;
  /** Полных суток до истечения, вверх. null — платежей не было. */
  daysLeft: number | null;
  subscriptionCredits: number;
  lastPaidAt: string | null;
  /**
   * Платёж застрял в `prepared` дольше суток: касса открыта, подтверждение не
   * пришло. Денег там нет — это брошенная касса, а не потерянная оплата.
   */
  stuckPrepared: boolean;
  /** Деньги списаны, а довести выдачу до конца автоматика не смогла. */
  needsManualReview: boolean;
}

/**
 * Платёж за подписку: GET /seller/subscription/payments и
 * GET /admin/shops/:id/subscription/payments отдают одну и ту же строку.
 */
export interface SubscriptionPaymentRow {
  id: number;
  provider: PaymentProvider;
  /** Снимок тарифа на момент оплаты: тариф магазина с тех пор мог поменяться. */
  plan: SubscriptionPlan;
  /** Сумма в сумах. */
  amount: number;
  status: SubscriptionPaymentStatus;
  /** Номер счёта — его же видит плательщик в чеке провайдера. */
  merchantBillingId: number;
  activatedFrom: string | null;
  activatedUntil: string | null;
  /** Сколько подписочных кредитов выдал платёж. */
  grantedCredits: number | null;
  /** Сколько неиспользованных подписочных кредитов сгорело при выдаче. */
  burnedCredits: number | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  /** Комментарий к ручной активации или отмене. */
  note: string | null;
  /** Что сообщил провайдер, отменяя платёж. */
  errorNote: string | null;
  /** Деньги возвращены плательщику. */
  reversed: boolean;
  /**
   * Возврат инициировал сам провайдер уже после выдачи подписки. Период при
   * этом не отзывается автоматически — строку разбирает администратор.
   */
  refundedByProvider: boolean;
  needsManualReview: boolean;
}

/** GET /admin/ai-usage — журнал обращений к ИИ: кто, какой магазин, во что обошлось. */
export interface AiUsageRow {
  id: number;
  operation: "prompt" | "description" | "image" | "autofill";
  model: string | null;
  images: number;
  /** Фактическая стоимость у OpenRouter. null — он её не вернул. */
  usd: number | null;
  /**
   * Снято с магазина. Ноль в двух разных случаях, и различает их поле `free`:
   * у администратора платит площадка, у подписчика — месячная норма тарифа.
   */
  credits: number;
  /**
   * Запрос прошёл по подписке: месячная норма автозаполнений либо безлимит
   * PRO/MAX. Кредитов не списано, но расход у OpenRouter настоящий — он уже
   * оплачен абонплатой. Фильтр списка: `free=true|false`.
   *
   * Необязательное: поле появилось вместе с подписками, а строки фикстур
   * (`lib/api/dev-fixtures.ts`) собраны до него. Сервер шлёт его всегда.
   */
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

/**
 * GET /admin/ai-usage/totals — сводка за всё время.
 *
 * Расход у OpenRouter разложен на три кармана, и складывать их обратно ради
 * «сколько всего потрачено» имеет право только тот, кому нужен именно расход.
 * Кому нужна маржа — не имеет: с `credits` сравнима одна лишь `usd`.
 *
 * До подписок карман был один, поэтому смысл поля `usd` сменился молча —
 * теперь это не весь расход, а только платная его часть.
 */
export interface AiUsageTotals {
  requests: number;
  images: number;
  /**
   * Платные операции: есть магазин и с него списаны кредиты. Ровно эта сумма
   * сравнима с `credits`, и только их разница — заработок на ИИ.
   */
  usd: number;
  /** Сколько снято с магазинов. */
  credits: number;
  /** Запросов, прошедших по подписке (норма либо безлимит). */
  freeRequests: number;
  /** Их себестоимость. Покрыта абонплатой, с `credits` несравнима. */
  freeUsd: number;
  /** Запросов администратора (`shopId = null`): проверки, разбор жалоб. */
  platformRequests: number;
  /** Их себестоимость. Выручки у них нет и не предполагалось. */
  platformUsd: number;
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
