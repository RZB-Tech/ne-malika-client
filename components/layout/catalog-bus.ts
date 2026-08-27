"use client";

const EVENT = "nemalika:open-catalog";

export function openCatalog() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenCatalog(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
