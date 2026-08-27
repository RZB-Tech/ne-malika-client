"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Sparkles, Trash2, X } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { RatingStars } from "@/components/shared/rating-stars";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  adminReviewsControllerApprove,
  adminReviewsControllerList,
  adminReviewsControllerRecheck,
  adminReviewsControllerReject,
  adminReviewsControllerRemove,
  adminReviewsControllerStats,
} from "@/lib/api/generated/endpoints/reviews-admin/reviews-admin";
import type {
  AdminReview,
  AiVerdict,
  Paginated,
  ReviewStatus,
  ReviewStatusCounts,
} from "@/lib/api/types";

const TABS: ReviewStatus[] = ["pending", "approved", "rejected"];
const KEY = "/api/v1/admin/reviews";

function AiVerdictLine({
  verdict,
  note,
  byHuman,
}: {
  verdict: AiVerdict | null;
  note: string | null;
  byHuman: boolean;
}) {
  const { t } = useT();

  if (byHuman) {
    return <p className="mt-2 text-xs text-muted-foreground">{t("admin.reviews.byHuman")}</p>;
  }

  if (!verdict) {
    return <p className="mt-2 text-xs text-warning">{t("admin.reviews.aiMissing")}</p>;
  }

  return (
    <p className="mt-2 text-xs text-muted-foreground">
      <span className="font-medium">{t(`admin.reviews.ai.${verdict}`)}</span>
      {note ? ` — ${note}` : ""}
    </p>
  );
}

export default function AdminReviews() {
  const { t, locale } = useT();
  const run = useAdminMutation();

  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [page, setPage] = useState(1);

  const params = { status, page, limit: 20 };
  const list = useQuery({
    queryKey: [KEY, params] as const,
    queryFn: ({ signal }) =>
      adminReviewsControllerList(params, undefined, signal) as unknown as Promise<
        Paginated<AdminReview>
      >,
    retry: false,
  });

  const stats = useQuery({
    queryKey: [KEY, "stats"] as const,
    queryFn: ({ signal }) =>
      adminReviewsControllerStats(undefined, signal) as unknown as Promise<ReviewStatusCounts>,
    retry: false,
  });

  const reviews = list.data?.data ?? [];
  const totalPages = list.data?.meta.totalPages ?? 1;

  const approve = (id: number) =>
    run(() => adminReviewsControllerApprove(id), {
      invalidate: [[KEY]],
      successKey: "admin.reviews.approved",
      errorKey: "common.actionFailed",
    });

  const reject = (id: number, reason: string) =>
    run(() => adminReviewsControllerReject(id, { reason }), {
      invalidate: [[KEY]],
      successKey: "admin.reviews.rejected",
      errorKey: "common.actionFailed",
    });

  const remove = (id: number) =>
    run(() => adminReviewsControllerRemove(id), {
      invalidate: [[KEY]],
      successKey: "admin.reviews.removed",
      errorKey: "common.actionFailed",
    });

  const recheck = (id: number) =>
    run(() => adminReviewsControllerRecheck(id), {
      invalidate: [[KEY]],
      successKey: "admin.reviews.rechecked",
      errorKey: "common.actionFailed",
    });

  return (
    <div className="space-y-6">
      <AdminPageHeader title={t("admin.reviews.title")} subtitle={t("admin.reviews.subtitle")} />

      <Tabs
        value={status}
        onValueChange={(value) => {
          setStatus(value as ReviewStatus);
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value} className="gap-1.5">
              {t(`reviews.status.${value}`)}
              <span className="text-xs text-muted-foreground tabular">
                {stats.data?.[value] ?? 0}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {list.isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.reviews.loadFailed")}
        </Card>
      )}

      {list.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : reviews.length === 0 && !list.isError ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          {t("admin.reviews.empty")}
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <RatingStars value={review.rating} />
                    <span className="font-medium text-foreground">{review.authorName}</span>
                    <Link
                      href={`/store/${review.shopId}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {review.shopName}
                    </Link>
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

                  {review.text ? (
                    <p className="mt-2 text-sm whitespace-pre-line text-foreground">
                      {review.text}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground italic">
                      {t("admin.reviews.noText")}
                    </p>
                  )}

                  {review.status === "rejected" && review.moderationNote && (
                    <p className="mt-2 text-xs text-destructive">
                      {t("reviews.rejectedReason", {
                        reason: review.moderationNote,
                      })}
                    </p>
                  )}

                  <AiVerdictLine
                    verdict={review.aiVerdict}
                    note={review.aiNote}
                    byHuman={review.moderatedBy !== null}
                  />
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => recheck(review.id)}
                    title={t("admin.reviews.recheckHint")}
                  >
                    <Sparkles className="size-3.5" />
                  </Button>
                  {review.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground hover:text-success"
                      onClick={() => approve(review.id)}
                    >
                      <Check className="size-3.5" />
                      {t("admin.reviews.approve")}
                    </Button>
                  )}
                  {review.status !== "rejected" && (
                    <AbolishDialog
                      title={t("admin.reviews.rejectTitle")}
                      description={t("admin.reviews.rejectText")}
                      onConfirm={(reason) => reject(review.id, reason)}
                    >
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5 text-muted-foreground hover:text-destructive"
                      >
                        <X className="size-3.5" />
                        {t("admin.reviews.reject")}
                      </Button>
                    </AbolishDialog>
                  )}
                  <ConfirmDialog
                    title={t("admin.reviews.removeTitle")}
                    description={t("admin.reviews.removeText")}
                    confirmLabel={t("common.delete")}
                    destructive
                    onConfirm={() => remove(review.id)}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>

              {review.status === "approved" && (
                <Badge variant="secondary" className="mt-3">
                  {t("reviews.status.approved")}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
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
    </div>
  );
}
