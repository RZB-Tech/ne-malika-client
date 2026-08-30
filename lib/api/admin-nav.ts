"use client";

import { useAdminProductCardsControllerAiReview } from "@/lib/api/generated/endpoints/product-cards-admin/product-cards-admin";
import { useAdminReportsControllerFindAll } from "@/lib/api/generated/endpoints/reports/reports";
import { useAdminReviewsControllerStats } from "@/lib/api/generated/endpoints/reviews-admin/reviews-admin";
import type { Paginated, ReviewStatusCounts } from "@/lib/api/types";

export interface AdminNavCounts {
  /** Жалоб в разборе. */
  reports: number;
  /** Отзывов ждёт решения модератора. */
  reviews: number;
  /** Карточек в очереди ручной ИИ-проверки. */
  aiReview: number;
}

/**
 * Счётчики для бейджей в меню админки: сколько работы ждёт в каждом разделе.
 *
 * Запросы висят в layout, то есть живут на всех страницах кабинета, поэтому
 * limit=1 — из ответа нужен только meta.total, сами строки не нужны. Минута
 * staleTime вместо общих тридцати секунд: цифра в меню не та вещь, ради
 * которой стоит ходить на сервер на каждом переходе.
 */
const COUNT_QUERY = { retry: false, staleTime: 60_000 } as const;

function totalOf(raw: unknown): number {
  return (raw as Paginated<unknown> | undefined)?.meta?.total ?? 0;
}

export function useAdminNavCounts(): AdminNavCounts {
  const reports = useAdminReportsControllerFindAll(
    { page: 1, limit: 1 },
    { query: { ...COUNT_QUERY, select: (raw) => totalOf(raw) } },
  );

  const aiReview = useAdminProductCardsControllerAiReview(
    { page: 1, limit: 1 },
    { query: { ...COUNT_QUERY, select: (raw) => totalOf(raw) } },
  );

  const reviews = useAdminReviewsControllerStats({
    query: {
      ...COUNT_QUERY,
      select: (raw) => (raw as unknown as ReviewStatusCounts | undefined)?.pending ?? 0,
    },
  });

  return {
    reports: reports.data ?? 0,
    reviews: reviews.data ?? 0,
    aiReview: aiReview.data ?? 0,
  };
}
