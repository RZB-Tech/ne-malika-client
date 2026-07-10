"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageview } from "@/lib/metrika";

/**
 * Досылает Метрике просмотры страниц при клиентской навигации: тег умеет
 * отправить только первый хит, а переходы по `next/link` меняют URL через
 * `history.pushState`, за которым он не следит. Без этого карточка товара,
 * открытая из каталога, в статистику не попадает вовсе.
 *
 * Слушаем путь, а не строку запроса: фильтры каталога переписывают `?q`,
 * `?priceMin`, `?sort` на каждое изменение, и хит улетал бы на каждый шаг.
 */
export function MetrikaPageview() {
  const pathname = usePathname();

  // Первый путь уже посчитан вызовом `init` — отправляем только переходы.
  const previous = useRef<string | null>(null);

  useEffect(() => {
    if (previous.current === pathname) return;

    const from = previous.current;
    previous.current = pathname;
    if (from === null) return;

    trackPageview(pathname, new URL(from, location.origin).href);
  }, [pathname]);

  return null;
}
