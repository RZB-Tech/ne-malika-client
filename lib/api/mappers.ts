// Adapters from backend rows to the frontend's display types (`Product`,
// `Store`). The backend model is leaner than the demo model, so absent fields
// (category, brand, rating, stock, views…) get sensible neutral defaults.

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

function statusToModeration(status: EntityStatus): ModerationStatus {
  switch (status) {
    case "active":
      return "published";
    case "hidden":
      return "moderation";
    case "abolished":
      return "rejected";
    default:
      return "published";
  }
}

function statusToSellerStatus(status: EntityStatus): SellerStatus {
  switch (status) {
    case "active":
      return "active";
    case "abolished":
      return "blocked";
    case "hidden":
      return "pending";
    default:
      return "active";
  }
}

function telegramUsername(link: string | null | undefined): string {
  if (!link) return "";
  return link
    .replace(/^https?:\/\/(t\.me|telegram\.me)\//i, "")
    .replace(/^@/, "")
    .replace(/\/+$/, "");
}

const DAY_LABELS: Record<WorkScheduleEntry["day"], string> = {
  Mo: "Пн",
  Tu: "Вт",
  We: "Ср",
  Th: "Чт",
  Fr: "Пт",
  Sa: "Сб",
  Su: "Вс",
};

export function formatWorkSchedule(
  schedule: WorkScheduleEntry[] | null | undefined,
): string {
  if (!schedule?.length) return "";
  const open = schedule.filter((e) => !e.isHoliday);
  if (!open.length) return "Выходной";
  const first = open[0];
  const label = open
    .map((e) => DAY_LABELS[e.day])
    .filter(Boolean)
    .join(", ");
  return `${label} ${first.start}–${first.end}`;
}

/** Public catalog / product-detail projection → Product. */
export function mapPublicProductCard(pc: PublicProductCard): Product {
  const photoUrls = toPhotoUrls(pc.photos);
  return {
    id: String(pc.id),
    slug: String(pc.id),
    name: pc.name,
    categorySlug: "",
    subcategory: "",
    brand: pc.shopName ?? "",
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
    moderation: "published",
    imageUrl: photoUrls[0] ?? null,
    photoUrls,
  };
}

/** Full product row (seller cabinet / inside a public shop) → Product. */
export function mapProductRow(pc: ProductCardRow, shopName = ""): Product {
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
    moderation: statusToModeration(pc.status),
    hidden: pc.status === "hidden",
    abolishReason: pc.abolishReason,
    imageUrl: photoUrls[0] ?? null,
    photoUrls,
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
    workingHours: formatWorkSchedule(s.workSchedule),
    rating: 0,
    ratingCount: 0,
    joined: s.createdAt,
    status: statusToSellerStatus(s.status),
    storeViews: 0,
    photoUrl: photoUrl(s.photo),
    location: s.location ?? null,
  };
}
