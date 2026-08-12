"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Star, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewFormDialog } from "@/components/reviews/review-form-dialog";
import { ReviewStatusBadge } from "@/components/reviews/reviews-section";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { formatDate } from "@/lib/format";
import { useDeleteReview, useMyReviews } from "@/lib/api/reviews";
import type { OwnReview } from "@/lib/api/types";

/**
 * Мои отзывы. Главное здесь — не список, а обратная связь: только тут человек
 * видит, что отзыв отклонён и почему, и может его поправить.
 */
export function MyReviews() {
  const { t, locale } = useT();
  const { isAuthenticated, isHydrated } = useAuth();

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<OwnReview | null>(null);

  const list = useMyReviews(page);
  const remove = useDeleteReview();

  const reviews = list.data?.data ?? [];
  const totalPages = list.data?.meta.totalPages ?? 1;

  const onDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success(t("reviews.deleted"));
    } catch {
      toast.error(t("reviews.deleteFailed"));
    }
  };

  if (!isHydrated) {
    return <Skeleton className="h-32 w-full rounded-2xl" />;
  }

  if (!isAuthenticated) {
    return (
      <Card className="flex flex-col items-center gap-3 py-16 text-center">
        <Star className="size-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t("account.reviews.guest")}
        </p>
        <LoginDialog>
          <Button size="sm">{t("nav.login")}</Button>
        </LoginDialog>
      </Card>
    );
  }

  if (list.isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="py-16 text-center text-sm text-muted-foreground">
        {t("account.reviews.empty")}
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {reviews.map((review) => (
        <Card key={review.id} className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <RatingStars value={review.rating} />
              {review.productCardId ? (
                <Link
                  href={`/product/${review.productCardId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {review.productName}
                </Link>
              ) : (
                <Link
                  href={`/store/${review.shopId}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {review.shopName}
                </Link>
              )}
              <span>· {formatDate(review.createdAt, locale)}</span>
            </div>
            <ReviewStatusBadge status={review.status} />
          </div>

          {review.text && (
            <p className="mt-2 text-sm whitespace-pre-line">{review.text}</p>
          )}

          {review.status === "rejected" && review.moderationNote && (
            <p className="mt-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {t("reviews.rejectedReason", { reason: review.moderationNote })}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setEditing(review)}
            >
              <Pencil className="size-3.5" />
              {t("common.edit")}
            </Button>
            <ConfirmDialog
              title={t("reviews.deleteTitle")}
              description={t("reviews.deleteText")}
              confirmLabel={t("common.delete")}
              destructive
              onConfirm={() => onDelete(review.id)}
            >
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="size-3.5" />
                {t("common.delete")}
              </Button>
            </ConfirmDialog>
          </div>
        </Card>
      ))}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            {t("common.back")}
          </Button>
          <span className="text-sm text-muted-foreground tabular">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("common.next")}
          </Button>
        </div>
      )}

      {/* Одно окно на весь список: цель берётся из того отзыва, который правят. */}
      {editing && (
        <ReviewFormDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          target={
            editing.productCardId
              ? { productId: editing.productCardId }
              : { shopId: editing.shopId }
          }
          existing={editing}
        />
      )}
    </div>
  );
}
