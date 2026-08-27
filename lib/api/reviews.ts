"use client";

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reviewsControllerCreate,
  reviewsControllerList,
  reviewsControllerMine,
  reviewsControllerRemove,
  reviewsControllerSummary,
  reviewsControllerUpdate,
} from "@/lib/api/generated/endpoints/reviews/reviews";
import type { OwnReview, Paginated, PublicReview, ReviewSummary } from "./types";

export type ReviewTarget = { productId: number } | { shopId: number };

const REVIEWS_KEY = "/api/v1/reviews";
const PRODUCTS_KEY = "/api/v1/product-cards";

function targetParams(target: ReviewTarget) {
  return "productId" in target ? { product_id: target.productId } : { shop_id: target.shopId };
}

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
      reviewsControllerSummary(params, undefined, signal) as unknown as Promise<ReviewSummary>,
  });
}

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
      reviewsControllerMine(params, undefined, signal) as unknown as Promise<Paginated<OwnReview>>,
  });
}

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
