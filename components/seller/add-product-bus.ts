"use client";

/**
 * Диалог создания товара живёт в layout кабинета, а открывают его из трёх мест:
 * пункта бокового меню, кнопки на главной и кнопки над списком товаров. Между
 * ними граница layout/page, поэтому событие на window — как и у шторки в шапке
 * (см. header-menu-bus).
 */
const EVENT = "nemalika:open-add-product";

export function openAddProduct() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenAddProduct(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
