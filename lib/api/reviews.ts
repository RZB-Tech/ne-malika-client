"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  reviewsControllerCreate,
  reviewsControllerList,
  reviewsControllerMine,
  reviewsControllerRemove,
  reviewsControllerSummary,
  reviewsControllerUpdate,
} from "@/lib/api/generated/endpoints/reviews/reviews";
import type {
  OwnReview,
  Paginated,
  PublicReview,
  ReviewSummary,
} from "./types";

/**
 * Отзывы витрины.
 *
 * Обёртки поверх сгенерированных вызовов: спека не описывает тела ответов, и
 * без этого слоя каждый компонент приводил бы `unknown` к типу сам.
 */

/** О чём отзыв: о товаре или о магазине целиком. */
export type ReviewTarget = { productId: number } | { shopId: number };

/** Префикс ключей react-query — по нему же идёт сброс после любой правки. */
const REVIEWS_KEY = "/api/v1/reviews";
const PRODUCTS_KEY = "/api/v1/product-cards";

function targetParams(target: ReviewTarget) {
  return "productId" in target
    ? { product_id: target.productId }
    : { shop_id: target.shopId };
}

/**
 * Лента отзывов с догрузкой по кнопке. Именно лента, а не страницы: отзывы
 * читают подряд, и переключатель «1 2 3» здесь только мешал бы.
 */
export function useReviewsFeed(target: ReviewTarget, limit = 10) {
  const base = targetParams(target);
  return useInfiniteQuery({
    queryKey: [REVIEWS_KEY, "list", base, limit] as const,
    queryFn: ({ pageParam, signal }) =>
      reviewsControllerList(
        { ...base, page: pageParam, limit },
        undefined,
        signal,
      ) as unknown as Promise<Paginated<PublicReview>>,
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  });
}

export function useReviewSummary(target: ReviewTarget) {
  const params = targetParams(target);
  return useQuery({
    queryKey: [REVIEWS_KEY, "summary", params] as const,
    queryFn: ({ signal }) =>
      reviewsControllerSummary(
        params,
        undefined,
        signal,
      ) as unknown as Promise<ReviewSummary>,
  });
}

/**
 * Отзыв этого человека об этом товаре или магазине, если он уже есть.
 * Нужен, чтобы предложить исправить прежний, а не писать второй: второй база
 * всё равно не примет.
 */
export function useMyReview(target: ReviewTarget, enabled: boolean) {
  const params = { ...targetParams(target), limit: 1 };
  return useQuery({
    queryKey: [REVIEWS_KEY, "mine", params] as const,
    enabled,
    queryFn: async ({ signal }) => {
      const page = (await reviewsControllerMine(
        params,
        undefined,
        signal,
      )) as unknown as Paginated<OwnReview>;
      return page.data[0] ?? null;
    },
  });
}

export function useMyReviews(page: number, limit = 20) {
  const params = { page, limit };
  return useQuery({
    queryKey: [REVIEWS_KEY, "mine", params] as const,
    queryFn: ({ signal }) =>
      reviewsControllerMine(params, undefined, signal) as unknown as Promise<
        Paginated<OwnReview>
      >,
  });
}

/**
 * Сброс кэша после правки отзыва. Вместе с отзывами обновляем и товары:
 * оценка попадает в плитку каталога, и без этого звёзды остались бы прежними
 * до истечения кэша.
 */
function useInvalidateReviews() {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [REVIEWS_KEY] }),
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
    ]);
  };
}

export interface ReviewInput {
  rating: number;
  text: string;
}

/** Создаёт отзыв или правит свой прежний — форма в обоих случаях одна. */
export function useSaveReview(target: ReviewTarget, existingId?: number) {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: async (input: ReviewInput) => {
      const body = { rating: input.rating, text: input.text.trim() };
      if (existingId) {
        await reviewsControllerUpdate(existingId, body);
        return;
      }
      await reviewsControllerCreate(
        "productId" in target
          ? { ...body, productCardId: target.productId }
          : { ...body, shopId: target.shopId },
      );
    },
    onSuccess: invalidate,
  });
}

export function useDeleteReview() {
  const invalidate = useInvalidateReviews();

  return useMutation({
    mutationFn: (id: number) => reviewsControllerRemove(id),
    onSuccess: invalidate,
  });
}
