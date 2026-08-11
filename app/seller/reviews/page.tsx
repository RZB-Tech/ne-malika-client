"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/shared/rating-stars";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  sellerReviewsControllerList,
  sellerReviewsControllerSummary,
} from "@/lib/api/generated/endpoints/reviews-seller/reviews-seller";
import type { Paginated, PublicReview, ReviewSummary } from "@/lib/api/types";

const KEY = "/api/v1/seller/reviews";
const STARS = [5, 4, 3, 2, 1];

/**
 * Отзывы о магазине глазами продавца — ровно те, что видит покупатель.
 * Непроверенных здесь нет: спорить о том, что может и не выйти в свет, не о чем.
 */
export default function SellerReviews() {
  const { t, locale } = useT();

  const summary = useQuery({
    queryKey: [KEY, "summary"] as const,
    queryFn: ({ signal }) =>
      sellerReviewsControllerSummary(
        undefined,
        signal,
      ) as unknown as Promise<ReviewSummary>,
    retry: false,
  });

  const params = { page: 1, limit: 50 };
  const list = useQuery({
    queryKey: [KEY, params] as const,
    queryFn: ({ signal }) =>
      sellerReviewsControllerList(
        params,
        undefined,
        signal,
      ) as unknown as Promise<Paginated<PublicReview>>,
    retry: false,
  });

  const count = summary.data?.count ?? 0;
  const average = summary.data?.average ?? 0;
  const reviews = list.data?.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("seller.reviews.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("seller.reviews.subtitle")}
        </p>
      </div>

      {summary.isLoading ? (
        <Skeleton className="h-28 w-full rounded-2xl" />
      ) : count > 0 ? (
        <Card className="grid gap-6 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="font-heading text-4xl font-bold tabular">
              {average.toFixed(1).replace(".", ",")}
            </span>
            <RatingStars value={average} size="md" />
            <span className="text-xs text-muted-foreground">
              {t("reviews.count", { count })}
            </span>
          </div>

          <div className="flex flex-col justify-center gap-1.5">
            {STARS.map((star) => {
              const value = summary.data?.breakdown?.[String(star)] ?? 0;
              const share = count > 0 ? (value / count) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="flex w-7 shrink-0 items-center gap-0.5 tabular text-muted-foreground">
                    {star}
                    <Star className="size-3 fill-amber-400 text-amber-400" />
                  </span>
                  <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-border">
                    <span
                      className="block h-full rounded-full bg-amber-400"
                      style={{ width: `${share}%` }}
                    />
                  </span>
                  <span className="w-6 shrink-0 text-right tabular text-muted-foreground">
                    {value}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          {t("seller.reviews.empty")}
        </Card>
      )}

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        reviews.length > 0 && (
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id} className="p-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <RatingStars value={review.rating} />
                  <span className="font-medium text-foreground">
                    {review.authorName}
                  </span>
                  {review.productCardId && (
                    <Link
                      href={`/product/${review.productCardId}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {review.productName}
                    </Link>
                  )}
                  <span>· {formatDate(review.createdAt, locale)}</span>
                </div>
                {review.text && (
                  <p className="mt-2 text-sm whitespace-pre-line">
                    {review.text}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
