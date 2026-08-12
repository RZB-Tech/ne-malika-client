"use client";

import { useState } from "react";
import { Loader2, MessageSquarePlus, Pencil, Star, Trash2 } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LoginDialog } from "@/components/auth/login-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RatingStars } from "@/components/shared/rating-stars";
import { ReviewFormDialog } from "./review-form-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { formatDate } from "@/lib/format";
import {
  useDeleteReview,
  useMyReview,
  useReviewSummary,
  useReviewsFeed,
  type ReviewTarget,
} from "@/lib/api/reviews";
import type { OwnReview, PublicReview, ReviewStatus } from "@/lib/api/types";

const STARS = [5, 4, 3, 2, 1];

/**
 * Отзывы о товаре или магазине: оценка, разбивка по звёздам, лента и своя
 * карточка автора. Один компонент на оба случая — различает их только цель.
 */
export function ReviewsSection({
  target,
  ownerId,
}: {
  target: ReviewTarget;
  /** Владелец магазина: себя оценивать нельзя, и кнопки он не видит. */
  ownerId?: number;
}) {
  const { t } = useT();
  const { isAuthenticated, isHydrated, user } = useAuth();

  const [formOpen, setFormOpen] = useState(false);

  const summary = useReviewSummary(target);
  const feed = useReviewsFeed(target);
  const mine = useMyReview(target, isAuthenticated);
  const remove = useDeleteReview();

  const reviews = (feed.data?.pages ?? []).flatMap((page) => page.data);
  const count = summary.data?.count ?? 0;
  const average = summary.data?.average ?? 0;
  const isOwner = ownerId !== undefined && user?.id === ownerId;

  const onDelete = async (id: number) => {
    try {
      await remove.mutateAsync(id);
      toast.success(t("reviews.deleted"));
    } catch {
      toast.error(t("reviews.deleteFailed"));
    }
  };

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-xl font-bold tracking-tight">
          {t("reviews.title")}
          {count > 0 && (
            <span className="ml-2 text-base font-medium text-muted-foreground tabular">
              {count}
            </span>
          )}
        </h2>

        {/* Кнопки нет у продавца — свой магазин оценивать нельзя, и сервер
            такой отзыв всё равно не примет. */}
        {isHydrated && !isOwner && !mine.data && (
          <WriteButton
            authenticated={isAuthenticated}
            onClick={() => setFormOpen(true)}
            label={t("reviews.write")}
          />
        )}
      </div>

      {summary.isLoading ? (
        <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
      ) : count > 0 ? (
        <div className="mt-4 grid gap-6 rounded-2xl bg-muted/40 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-10">
          <div className="flex flex-col items-center justify-center gap-1">
            <span className="font-heading text-4xl font-bold tabular">
              {average.toFixed(1).replace(".", ",")}
            </span>
            <RatingStars value={average} size="md" />
            <span className="text-xs text-muted-foreground">
              {t("reviews.count", { count })}
            </span>
          </div>

          {/* Разбивка по звёздам: одна средняя цифра скрывает, из чего она
              сложилась — «4,0» бывает и у ровных четвёрок, и у пятёрок с
              двойкой. */}
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
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {t("reviews.empty")}
        </p>
      )}

      {mine.data && (
        <MyReview
          review={mine.data}
          onEdit={() => setFormOpen(true)}
          onDelete={() => onDelete(mine.data!.id)}
        />
      )}

      {feed.isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        reviews.length > 0 && (
          <ul className="mt-6 space-y-4">
            {reviews.map((review) => (
              <li key={review.id}>
                <ReviewItem review={review} />
              </li>
            ))}
          </ul>
        )
      )}

      {feed.hasNextPage && (
        <div className="mt-5 flex justify-center">
          <Button
            variant="outline"
            onClick={() => feed.fetchNextPage()}
            disabled={feed.isFetchingNextPage}
          >
            {feed.isFetchingNextPage && (
              <Loader2 className="size-4 animate-spin" />
            )}
            {t("reviews.more")}
          </Button>
        </div>
      )}

      <ReviewFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        target={target}
        existing={mine.data}
      />
    </section>
  );
}

/** Гостю кнопка сначала предлагает войти: отзыв привязан к человеку. */
function WriteButton({
  authenticated,
  onClick,
  label,
}: {
  authenticated: boolean;
  onClick: () => void;
  label: string;
}) {
  const button = (
    <Button size="sm" className="gap-1.5" onClick={authenticated ? onClick : undefined}>
      <MessageSquarePlus className="size-4" />
      {label}
    </Button>
  );

  return authenticated ? button : <LoginDialog>{button}</LoginDialog>;
}

/**
 * Свой отзыв. Показывается отдельно от ленты и всегда: пока модератор не
 * посмотрел, в общем списке его нет, и без этой карточки человек решил бы,
 * что отзыв пропал.
 */
function MyReview({
  review,
  onEdit,
  onDelete,
}: {
  review: OwnReview;
  onEdit: () => void;
  onDelete: () => Promise<void>;
}) {
  const { t, locale } = useT();

  return (
    <Card className="mt-6 border-primary/30 bg-primary/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{t("reviews.mine")}</span>
          <ReviewStatusBadge status={review.status} />
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(review.createdAt, locale)}
        </span>
      </div>

      <div className="mt-2">
        <RatingStars value={review.rating} />
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
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
          <Pencil className="size-3.5" />
          {t("common.edit")}
        </Button>
        <ConfirmDialog
          title={t("reviews.deleteTitle")}
          description={t("reviews.deleteText")}
          confirmLabel={t("common.delete")}
          destructive
          onConfirm={onDelete}
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
  );
}

function ReviewItem({ review }: { review: PublicReview }) {
  const { t, locale } = useT();

  return (
    <div className="border-b border-border pb-4 last:border-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-medium">{review.authorName}</span>
        <RatingStars value={review.rating} />
        <span className="text-xs text-muted-foreground">
          {formatDate(review.createdAt, locale)}
        </span>
      </div>

      {/* На странице магазина видно, о каком товаре речь: оценка продавца
          складывается из отзывов обо всех его товарах. */}
      {review.productName && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("reviews.aboutProduct", { name: review.productName })}
        </p>
      )}

      {review.text && (
        <p className="mt-2 text-sm leading-relaxed whitespace-pre-line">
          {review.text}
        </p>
      )}
    </div>
  );
}

export function ReviewStatusBadge({ status }: { status: ReviewStatus }) {
  const { t } = useT();

  if (status === "approved") {
    return <Badge variant="secondary">{t("reviews.status.approved")}</Badge>;
  }
  if (status === "rejected") {
    return <Badge variant="destructive">{t("reviews.status.rejected")}</Badge>;
  }
  return <Badge variant="outline">{t("reviews.status.pending")}</Badge>;
}
