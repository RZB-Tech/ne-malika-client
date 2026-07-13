"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductImage } from "@/components/shared/product-image";
import { ModerationBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { useSellerShopsControllerList } from "@/lib/api/generated/endpoints/shops-seller/shops-seller";
import {
  useSellerProductCardsControllerList,
  useSellerProductCardsControllerRemove,
} from "@/lib/api/generated/endpoints/product-cards-seller/product-cards-seller";
import { mapProductRow } from "@/lib/api/mappers";
import type { ProductCardRow, ShopRow } from "@/lib/api/types";

export default function SellerProducts() {
  const { t, locale } = useT();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");

  const shopsQuery = useSellerShopsControllerList({
    query: { select: (raw) => raw as unknown as ShopRow[] },
  });
  const shop = shopsQuery.data?.[0];

  const productsQuery = useSellerProductCardsControllerList(shop?.id ?? 0, {
    query: {
      enabled: Boolean(shop),
      select: (raw) => raw as unknown as ProductCardRow[],
    },
  });

  const removeMutation = useSellerProductCardsControllerRemove();

  const rows = useMemo(
    () => (productsQuery.data ?? []).map((r) => mapProductRow(r, shop?.name)),
    [productsQuery.data, shop?.name],
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? rows.filter((p) => p.name.toLowerCase().includes(s)) : rows;
  }, [rows, q]);

  const remove = async (id: string, name: string) => {
    if (!window.confirm(t("seller.products.deleteConfirm"))) return;
    try {
      await removeMutation.mutateAsync({ id: Number(id) });
      await queryClient.invalidateQueries();
      toast.success(t("common.delete"), { description: name });
    } catch {
      toast.error("Не удалось удалить товар");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t("seller.products.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("seller.products.subtitle")}</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/seller/products/new">
            <PlusCircle className="size-4" />
            {t("seller.products.addNew")}
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("seller.products.search")} className="pl-9" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[240px]">{t("seller.products.colName")}</TableHead>
                <TableHead>{t("seller.products.colPrice")}</TableHead>
                <TableHead>{t("seller.products.colModeration")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow
                  key={p.id}
                  onClick={() => router.push(`/seller/products/${p.id}`)}
                  className="cursor-pointer"
                >
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
                      <div className="min-w-0">
                        <Link href={`/seller/products/${p.id}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {p.isNew ? "Новый" : "Б/у"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium tabular">
                    {formatPrice(p.price, locale)} {t("common.currency")}
                  </TableCell>
                  <TableCell><ModerationBadge status={p.moderation} /></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${p.id}`}><Send className="size-4" /> {t("seller.products.viewOnSite")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/seller/products/${p.id}`}><Pencil className="size-4" /> {t("common.edit")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => remove(p.id, p.name)}>
                          <Trash2 className="size-4" /> {t("common.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {(shopsQuery.isLoading || productsQuery.isLoading) && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!productsQuery.isLoading && !shopsQuery.isLoading && list.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("seller.products.empty")}</div>
        )}
      </Card>
    </div>
  );
}
