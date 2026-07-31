"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, TriangleAlert, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/shared/product-image";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import { Pagination } from "@/components/shared/pagination";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate, formatPrice } from "@/lib/format";
import {
  useAdminProductCardsControllerAiReview,
  useAdminProductCardsControllerRecheck,
  useAdminProductCardsControllerRestore,
} from "@/lib/api/generated/endpoints/product-cards-admin/product-cards-admin";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import {
  devAiReview,
  devFallbackPage,
  usingDevData,
} from "@/lib/api/dev-fixtures";
import type { AiReviewRow, Paginated } from "@/lib/api/types";

export default function AdminAiReview() {
  const { t, locale } = useT();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminProductCardsControllerAiReview(
    { page, limit: 20 },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AiReviewRow>,
        retry: false,
      },
    },
  );

  const restoreMutation = useAdminProductCardsControllerRestore();
  const recheckMutation = useAdminProductCardsControllerRecheck();

  const pageData = devFallbackPage(data, devAiReview);
  const rows = pageData.data;
  const isDevData = usingDevData(data?.data);

  const approve = async (id: number) => {
    await restoreMutation.mutateAsync({ id });
    await queryClient.invalidateQueries();
    toast.success("Товар одобрен и вернулся в выдачу");
  };

  const recheck = async (id: number) => {
    await recheckMutation.mutateAsync({ id });
    await queryClient.invalidateQueries();
    toast.success("Отправлено на повторную проверку");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Проверка ИИ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Товары, которые проверка забраковала или не смогла обработать. Их
          нужно посмотреть глазами: одобрить вручную или отправить на повтор.
        </p>
      </div>

      {isError && !isDevData && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить очередь.
        </Card>
      )}

      {isDevData && (
        <Card className="bg-muted/50 p-4 text-sm text-muted-foreground">
          Показаны тестовые данные: бэкенд недоступен.
        </Card>
      )}

      {isLoading && <Skeleton className="h-40 w-full rounded-xl" />}

      {!isLoading && rows.length === 0 && (
        <Card className="flex flex-col items-center gap-3 py-16 text-center">
          <CheckCircle2 className="size-10 text-success" />
          <div>
            <div className="font-medium">Очередь пуста</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Все проверки прошли без сбоев и отказов.
            </p>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-4">
        {rows.map((row) => (
          <Card key={row.checkId} className="flex flex-col gap-4 p-5">
            <div className="flex flex-wrap items-start gap-4">
              <ProductImage
                hue={hueFromId(row.productCardId)}
                categorySlug=""
                src={photoUrl(row.photos?.[0])}
                alt={row.name}
                className="size-16 shrink-0 rounded-xl"
                iconClassName="size-5"
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{row.name}</span>
                  <EntityStatusBadge status={row.status} />
                </div>
                <div className="mt-0.5 text-sm text-muted-foreground">
                  {row.shopName} · {formatPrice(Number(row.price), locale)}{" "}
                  {t("common.currency")} ·{" "}
                  {formatDate(row.checkedAt, locale)}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void recheck(row.productCardId)}
                >
                  <RefreshCw className="size-4" /> Перепроверить
                </Button>
                <Button size="sm" onClick={() => void approve(row.productCardId)}>
                  <CheckCircle2 className="size-4" /> Одобрить
                </Button>
              </div>
            </div>

            {/* Сбой сервиса и отказ модели — разные ситуации, показываем по-разному. */}
            {row.error ? (
              <div className="flex gap-2 rounded-lg bg-muted p-3 text-sm">
                <TriangleAlert className="size-4 shrink-0 text-warning" />
                <div>
                  <div className="font-medium">Проверка не выполнена</div>
                  <p className="mt-0.5 text-muted-foreground">{row.error}</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 rounded-lg bg-destructive/8 p-3 text-sm">
                <XCircle className="size-4 shrink-0 text-destructive" />
                <div>
                  <div className="font-medium text-destructive">
                    Модель забраковала товар
                  </div>
                  <p className="mt-0.5 text-muted-foreground">
                    {row.summary ?? "Без пояснения"}
                  </p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      <Pagination
        page={pageData.meta.page}
        totalPages={pageData.meta.totalPages}
        total={pageData.meta.total}
        onChange={setPage}
      />
    </div>
  );
}
