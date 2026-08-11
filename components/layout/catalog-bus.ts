"use client";

/**
 * Меню каталога живёт в шапке, а открывают его из двух мест: своей кнопки и
 * нижней панели навигации на телефоне. Между ними нет общего родителя, поэтому
 * событие на window — как у диалога товара (см. add-product-bus).
 */
const EVENT = "nemalika:open-catalog";

export function openCatalog() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenCatalog(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
