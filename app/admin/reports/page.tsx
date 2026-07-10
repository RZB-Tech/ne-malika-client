"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Store } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import { useAdminReportsControllerFindAll } from "@/lib/api/generated/endpoints/reports/reports";
import { useAdminProductCardsControllerAbolish } from "@/lib/api/generated/endpoints/product-cards-admin/product-cards-admin";
import { useAdminShopsControllerAbolish } from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import type { Paginated, ReportRow } from "@/lib/api/types";

export default function AdminReports() {
  const { locale } = useT();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminReportsControllerFindAll(
    { page, limit: 20 },
    { query: { select: (raw) => raw as unknown as Paginated<ReportRow>, retry: false } },
  );

  const abolishProduct = useAdminProductCardsControllerAbolish();
  const abolishShop = useAdminShopsControllerAbolish();

  const reports = useMemo(() => data?.data ?? [], [data]);
  const totalPages = data?.meta.totalPages ?? 1;

  const onAbolishProduct = async (id: number, reason: string) => {
    await abolishProduct.mutateAsync({ id, data: { reason } });
    await queryClient.invalidateQueries();
    toast.success("Товар упразднён");
  };
  const onAbolishShop = async (id: number, reason: string) => {
    await abolishShop.mutateAsync({ id, data: { reason } });
    await queryClient.invalidateQueries();
    toast.success("Магазин упразднён");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">Жалобы</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Жалобы покупателей на магазины и товары.
        </p>
      </div>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить жалобы. Раздел доступен только администраторам.
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : reports.length === 0 && !isError ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          Жалоб пока нет.
        </Card>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">
                      {r.productCardId ? "Товар" : "Магазин"}
                    </Badge>
                    <Link href={`/store/${r.shopId}`} className="hover:text-foreground hover:underline">
                      магазин #{r.shopId}
                    </Link>
                    {r.productCardId && (
                      <Link href={`/product/${r.productCardId}`} className="hover:text-foreground hover:underline">
                        товар #{r.productCardId}
                      </Link>
                    )}
                    <span>· {formatDate(r.createdAt, locale)}</span>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{r.context}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {r.productCardId && (
                    <AbolishDialog
                      title="Упразднить товар"
                      onConfirm={(reason) => onAbolishProduct(r.productCardId!, reason)}
                    >
                      <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive">
                        <Ban className="size-3.5" /> Товар
                      </Button>
                    </AbolishDialog>
                  )}
                  <AbolishDialog
                    title="Упразднить магазин"
                    description="Все товары магазина будут скрыты."
                    onConfirm={(reason) => onAbolishShop(r.shopId, reason)}
                  >
                    <Button size="sm" variant="ghost" className="gap-1.5 text-muted-foreground hover:text-destructive">
                      <Store className="size-3.5" /> Магазин
                    </Button>
                  </AbolishDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Назад
          </Button>
          <span className="text-sm text-muted-foreground tabular">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Вперёд
          </Button>
        </div>
      )}
    </div>
  );
}
