"use client";

const EVENT = "nemalika:open-add-product";

export function openAddProduct() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenAddProduct(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
