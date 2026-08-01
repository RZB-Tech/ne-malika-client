"use client";

/**
 * Шторка живёт в шапке (layout), а открыть её нужно и из каталога — из кнопки
 * «Фильтры» над сеткой. Контекст сюда не протянуть: между ними граница
 * layout/page, а поднимать состояние в общий провайдер ради одного булева
 * дороже, чем событие на window.
 */
const EVENT = "nemalika:open-header-menu";

export function openHeaderMenu() {
  window.dispatchEvent(new Event(EVENT));
}

export function onOpenHeaderMenu(handler: () => void) {
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
