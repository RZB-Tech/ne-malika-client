"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, Search } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductImage } from "@/components/shared/product-image";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { useProductCardsControllerFindAll } from "@/lib/api/generated/endpoints/product-cards-public/product-cards-public";
import { useAdminProductCardsControllerAbolish } from "@/lib/api/generated/endpoints/product-cards-admin/product-cards-admin";
import { mapPublicProductCard } from "@/lib/api/mappers";
import type { Paginated, PublicProductCard } from "@/lib/api/types";

export default function AdminProducts() {
  const { t, locale } = useT();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const { data, isLoading } = useProductCardsControllerFindAll(
    { limit: 100, q: q.trim() || undefined },
    { query: { select: (raw) => raw as unknown as Paginated<PublicProductCard> } },
  );

  const abolishMutation = useAdminProductCardsControllerAbolish();

  const rows = useMemo(
    () => (data?.data ?? []).map(mapPublicProductCard),
    [data],
  );

  const abolish = async (id: number, reason: string) => {
    await abolishMutation.mutateAsync({ id, data: { reason } });
    await queryClient.invalidateQueries();
    toast.success("Товар упразднён");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.products.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Активные товары в публичной выдаче. Упразднение скрывает товар и уведомляет продавца.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по товарам" className="pl-9" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[260px]">{t("admin.products.colProduct")}</TableHead>
                <TableHead>{t("admin.products.colStore")}</TableHead>
                <TableHead>{t("admin.products.colPrice")}</TableHead>
                <TableHead className="w-[150px] text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductImage
                        hue={p.hue}
                        categorySlug={p.categorySlug}
                        src={p.imageUrl}
                        alt={p.name}
                        className="size-10 shrink-0 rounded-lg"
                        iconClassName="size-4"
                      />
                      <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                        {p.name}
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{p.brand}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium tabular">
                    {formatPrice(p.price, locale)} {t("common.currency")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <AbolishDialog
                        title="Упразднить товар"
                        description="Товар будет скрыт из публичной выдачи. Причина видна продавцу."
                        onConfirm={(reason) => abolish(Number(p.id), reason)}
                      >
                        <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground hover:text-destructive">
                          <Ban className="size-3.5" /> Упразднить
                        </Button>
                      </AbolishDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("catalog.emptyTitle")}</div>
        )}
      </Card>
    </div>
  );
}
