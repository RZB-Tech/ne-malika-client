"use client";

import { useEffect, useRef } from "react";
import { useProductViewsControllerRecord } from "@/lib/api/generated/endpoints/me-product-views/me-product-views";
import { useAuth } from "@/lib/api/auth";
import { recordLocalView, type ViewedProduct } from "@/lib/history/local-history";
import { trackProductView } from "@/lib/analytics";

/**
 * Отмечает просмотр карточки. Ничего не рисует — висит на странице товара
 * рядом с разметкой.
 *
 * Снимок товара приходит пропсом с сервера: он уже загружен для самой
 * страницы, и лишний запрос к API ради названия с ценой не нужен.
 *
 * Две независимые вещи с общим триггером. Личная история («что я смотрел»)
 * пишется только вошедшему и ждёт готовности авторизации. Счётчик для продавца
 * считает всех, поэтому уходит сразу и в своём эффекте — иначе анонимы, которых
 * большинство, в статистику не попали бы вовсе.
 */
export function TrackProductView({
  product,
}: {
  product: Omit<ViewedProduct, "viewedAt">;
}) {
  const { isAuthenticated, isHydrated } = useAuth();
  const { mutate } = useProductViewsControllerRecord();

  const localDone = useRef<number | null>(null);
  const remoteDone = useRef<number | null>(null);
  const statsDone = useRef<number | null>(null);

  useEffect(() => {
    if (statsDone.current === product.id) return;
    statsDone.current = product.id;
    trackProductView(product.id);
  }, [product.id]);

  useEffect(() => {
    if (!isHydrated) return;

    if (localDone.current !== product.id) {
      localDone.current = product.id;
      recordLocalView(product);
    }

    if (isAuthenticated && remoteDone.current !== product.id) {
      remoteDone.current = product.id;
      mutate({ data: { product_card_id: product.id } });
    }
  }, [product, isHydrated, isAuthenticated, mutate]);

  return null;
}
