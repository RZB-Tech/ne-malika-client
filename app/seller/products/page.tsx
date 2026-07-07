"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Eye,
  EyeOff,
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
import { ModerationBadge, AvailabilityBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber, formatPrice } from "@/lib/format";
import { products, CURRENT_STORE_ID, type Product } from "@/lib/data";

export default function SellerProducts() {
  const { t, locale } = useT();
  const [rows, setRows] = useState<Product[]>(() =>
    products.filter((p) => p.storeId === CURRENT_STORE_ID),
  );
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const filtered = s
      ? rows.filter((p) => `${p.name} ${p.brand} ${p.model} ${p.sku}`.toLowerCase().includes(s))
      : rows;
    return [...filtered].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [rows, q]);

  const toggleHidden = (id: string) => {
    setRows((r) => r.map((p) => (p.id === id ? { ...p, hidden: !p.hidden } : p)));
    const p = rows.find((x) => x.id === id);
    toast.success(p?.hidden ? t("seller.products.show") : t("seller.products.hide"), {
      description: p?.name,
    });
  };

  const remove = (id: string) => {
    const p = rows.find((x) => x.id === id);
    if (!window.confirm(t("seller.products.deleteConfirm"))) return;
    setRows((r) => r.filter((x) => x.id !== id));
    toast.success(t("common.delete"), { description: p?.name });
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
                <TableHead>{t("seller.products.colStatus")}</TableHead>
                <TableHead>{t("seller.products.colModeration")}</TableHead>
                <TableHead className="text-right">{t("seller.products.colViews")}</TableHead>
                <TableHead className="text-right">{t("seller.products.colClicks")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.id} className={p.hidden ? "opacity-55" : ""}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductImage hue={p.hue} categorySlug={p.categorySlug} className="size-10 shrink-0 rounded-lg" iconClassName="size-4" />
                      <div className="min-w-0">
                        <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                          {p.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">{p.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm font-medium tabular">
                    {formatPrice(p.price, locale)} {t("common.currency")}
                  </TableCell>
                  <TableCell><AvailabilityBadge status={p.availability} className="px-1.5 text-[11px]" /></TableCell>
                  <TableCell><ModerationBadge status={p.moderation} /></TableCell>
                  <TableCell className="text-right text-sm tabular text-muted-foreground">{formatNumber(p.views, locale)}</TableCell>
                  <TableCell className="text-right text-sm tabular text-muted-foreground">{formatNumber(p.telegramClicks, locale)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${p.id}`}><Send className="size-4" /> {t("product.store")}</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem><Pencil className="size-4" /> {t("common.edit")}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleHidden(p.id)}>
                          {p.hidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                          {p.hidden ? t("seller.products.show") : t("seller.products.hide")}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onClick={() => remove(p.id)}>
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
        {list.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("seller.products.empty")}</div>
        )}
      </Card>
    </div>
  );
}
