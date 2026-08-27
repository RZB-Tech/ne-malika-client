import { productStatsControllerRecord } from "./api/generated/endpoints/product-stats/product-stats";
import type { RecordProductEventDtoKind } from "./api/generated/schemas";


const VISITOR_KEY = "nm_visitor_id";

export type ContactKind = "phone" | "telegram";

export function visitorId(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(VISITOR_KEY);
    if (saved) return saved;

    const fresh = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, fresh);
    return fresh;
  } catch {
    return null;
  }
}

function send(
  productId: string | number,
  kind: RecordProductEventDtoKind,
): void {
  const visitor = visitorId();
  if (!visitor) return;

  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) return;

  void productStatsControllerRecord(id, {
    kind,
    visitor_id: visitor,
  }).catch(() => {});
}

export function trackProductView(productId: string | number): void {
  send(productId, "view");
}

export function trackContact(
  productId: string | number,
  kind: ContactKind,
): void {
  send(productId, kind);
}
