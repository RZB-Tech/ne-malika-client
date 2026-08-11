import type { ModerationStatus, Product, SellerStatus, Store } from "@/lib/data";
import { photoUrl } from "./photo";
import type {
  EntityStatus,
  ProductCardRow,
  PublicProductCard,
  PublicShop,
  ShopRow,
  WorkScheduleEntry,
} from "./types";

/** Stable hue in [0,360) derived from a numeric/string id. */
export function hueFromId(id: number | string): number {
  const n =
    typeof id === "number"
      ? id
      : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return (n * 47) % 360;
}

function toPhotoUrls(photos: string[] | null | undefined): string[] {
  return (photos ?? [])
    .map((k) => photoUrl(k))
    .filter((u): u is string => Boolean(u));
}

const MODERATION_BY_STATUS: Record<EntityStatus, ModerationStatus> = {
  active: "published",
  hidden: "moderation",
  abolished: "rejected",
  pending: "moderation",
};

const SELLER_STATUS_BY_STATUS: Record<EntityStatus, SellerStatus> = {
  active: "active",
  hidden: "pending",
  abolished: "blocked",
  pending: "pending",
};

function telegramUsername(link: string | null | undefined): string {
  if (!link) return "";
  return link
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
}

/**
 * Расписание строкой вида «Пн, Вт, Ср 09:00–18:00». Переводчик приходит
 * параметром, а не берётся из контекста: функция вызывается и из компонентов,
 * и из мапперов, где хуков нет.
 */
export function formatWorkSchedule(
  schedule: WorkScheduleEntry[] | null | undefined,
  t: (path: string) => string,
): string {
  if (!schedule?.length) return "";
  const open = schedule.filter((e) => !e.isHoliday);
  if (!open.length) return t("seller.profile.dayOff");
  const first = open[0];
  const label = open
    .map((e) => t(`weekdaysShort.${e.day}`))
    .filter(Boolean)
    .join(", ");
  return `${label} ${first.start}–${first.end}`;
}

/** Общая часть обеих проекций товара — публичной и полной строки таблицы. */
function toProduct(
  pc: PublicProductCard | ProductCardRow,
  shopName: string,
  status: EntityStatus,
): Product {
  const photoUrls = toPhotoUrls(pc.photos);
  return {
    id: String(pc.id),
    slug: String(pc.id),
    name: pc.name,
    categorySlug: "",
    subcategory: "",
    brand: shopName,
    model: "",
    sku: "",
    price: Number(pc.price),
    description: pc.description ?? "",
    specs: (pc.characteristics ?? []).map((c) => ({
      name: c.key,
      value: c.value,
    })),
    warrantyMonths: 0,
    availability: "in_stock",
    quantity: 1,
    storeId: String(pc.shopId),
    hue: hueFromId(pc.id),
    views: 0,
    telegramClicks: 0,
    createdAt: pc.createdAt,
    isNew: pc.state === "new",
    moderation: MODERATION_BY_STATUS[status] ?? "published",
    imageUrl: photoUrls[0] ?? null,
    photoUrls,
    photoKeys: pc.photos ?? [],
  };
}

/** Публичная выдача: бэкенд отдаёт только активные товары. */
export function mapPublicProductCard(pc: PublicProductCard): Product {
  return toProduct(pc, pc.shopName ?? "", "active");
}

/** Полная строка товара (кабинет продавца, товары внутри магазина). */
export function mapProductRow(pc: ProductCardRow, shopName = ""): Product {
  return {
    ...toProduct(pc, shopName, pc.status),
    hidden: pc.status === "hidden",
    abolishReason: pc.abolishReason,
  };
}

export function mapShop(s: ShopRow | PublicShop): Store {
  return {
    id: String(s.id),
    slug: String(s.id),
    name: s.name,
    logoHue: hueFromId(s.id),
    description: s.description ?? "",
    address: s.address ?? "",
    city: "",
    phone: s.contact ?? "",
    telegram: telegramUsername(s.telegramLink),
    telegramLink: s.telegramLink ?? undefined,
    // Строкой не собираем: подписи дней зависят от языка, а он известен только
    // в компоненте. Отдаём расписание как есть, формат — на месте показа.
    workSchedule: s.workSchedule ?? undefined,
    workingHours: "",
    rating: 0,
    ratingCount: 0,
    joined: s.createdAt,
    status: SELLER_STATUS_BY_STATUS[s.status] ?? "active",
    storeViews: 0,
    photoUrl: photoUrl(s.photo),
    location: s.location ?? null,
  };
}
