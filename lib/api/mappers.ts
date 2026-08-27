import type { ModerationStatus, Product, SellerStatus, Store } from "@/lib/data";
import { photoUrl } from "./photo";
import { parseTelegramUsername } from "@/lib/telegram";
import type {
  EntityStatus,
  ProductCardRow,
  PublicProductCard,
  PublicShop,
  ShopRow,
  WorkScheduleEntry,
} from "./types";

export function hueFromId(id: number | string): number {
  const n =
    typeof id === "number" ? id : Array.from(String(id)).reduce((a, c) => a + c.charCodeAt(0), 0);
  return (n * 47) % 360;
}

function toPhotoUrls(photos: string[] | null | undefined): string[] {
  return (photos ?? []).map((k) => photoUrl(k)).filter((u): u is string => Boolean(u));
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

export function formatWorkSchedule(
  schedule: WorkScheduleEntry[] | null | undefined,
  t: (path: string) => string,
): string {
  if (!schedule?.length) return "";
  const open = schedule.filter((e) => !e.isHoliday);
  if (!open.length) return t("seller.profile.dayOff");

  const groups = new Map<string, string[]>();
  for (const entry of open) {
    const hours = `${entry.start}–${entry.end}`;
    const days = groups.get(hours) ?? [];
    days.push(t(`weekdaysShort.${entry.day}`));
    groups.set(hours, days);
  }

  return [...groups].map(([hours, days]) => `${days.join(", ")} ${hours}`).join(" · ");
}

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
    categorySlug: ("categorySlug" in pc ? pc.categorySlug : null) ?? "",
    subcategory: "",
    brand: shopName,
    model: "",
    sku: "",
    price: pc.price === null || pc.price === undefined ? null : Number(pc.price),
    description: pc.description ?? "",
    specs: (pc.characteristics ?? []).map((c) => ({
      name: c.key,
      value: c.value,
    })),
    warrantyMonths: 0,
    rating: pc.ratingAvg ?? 0,
    ratingCount: pc.ratingCount ?? 0,
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

export function mapPublicProductCard(pc: PublicProductCard): Product {
  return toProduct(pc, pc.shopName ?? "", "active");
}

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
    ownerId: s.owner,
    name: s.name,
    logoHue: hueFromId(s.id),
    description: s.description ?? "",
    address: s.address ?? "",
    city: "",
    phone: s.contact ?? "",
    telegram: (s.telegramLink && parseTelegramUsername(s.telegramLink)) ?? "",
    telegramLink: s.telegramLink ?? undefined,
    workSchedule: s.workSchedule ?? undefined,
    workingHours: "",
    rating: s.ratingAvg ?? 0,
    ratingCount: s.ratingCount ?? 0,
    joined: s.createdAt,
    status: SELLER_STATUS_BY_STATUS[s.status] ?? "active",
    storeViews: 0,
    photoUrl: photoUrl(s.photo),
    location: s.location ?? null,
  };
}
