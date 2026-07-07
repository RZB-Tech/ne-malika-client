"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductImage } from "@/components/shared/product-image";
import { ModerationBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import { products as initial, getStore, type ModerationStatus, type Product } from "@/lib/data";

type Tab = "all" | "moderation" | "published" | "rejected";

export default function AdminProducts() {
  const { t, locale } = useT();
  const [rows, setRows] = useState<Product[]>(initial);
  const [tab, setTab] = useState<Tab>("moderation");

  const counts = useMemo(
    () => ({
      all: rows.length,
      moderation: rows.filter((p) => p.moderation === "moderation").length,
      published: rows.filter((p) => p.moderation === "published").length,
      rejected: rows.filter((p) => p.moderation === "rejected").length,
    }),
    [rows],
  );

  const list = useMemo(() => {
    const l = tab === "all" ? rows : rows.filter((p) => p.moderation === tab);
    return [...l].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [rows, tab]);

  const setModeration = (id: string, status: ModerationStatus, msg: string) => {
    const p = rows.find((x) => x.id === id);
    setRows((r) => r.map((x) => (x.id === id ? { ...x, moderation: status } : x)));
    toast.success(msg, { description: p?.name });
  };

  const tabs: Tab[] = ["moderation", "published", "rejected", "all"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.products.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.products.subtitle")}</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          {tabs.map((tb) => (
            <TabsTrigger key={tb} value={tb} className="gap-1.5">
              {t(`admin.products.tabs.${tb}`)}
              <span className="rounded bg-muted px-1.5 text-xs tabular text-muted-foreground">
                {counts[tb]}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[260px]">{t("admin.products.colProduct")}</TableHead>
                <TableHead>{t("admin.products.colStore")}</TableHead>
                <TableHead>{t("admin.products.colPrice")}</TableHead>
                <TableHead>{t("admin.products.colStatus")}</TableHead>
                <TableHead className="w-[150px] text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => {
                const store = getStore(p.storeId);
                return (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ProductImage hue={p.hue} categorySlug={p.categorySlug} className="size-10 shrink-0 rounded-lg" iconClassName="size-4" />
                        <Link href={`/product/${p.id}`} className="line-clamp-1 text-sm font-medium hover:text-primary">
                          {p.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{store?.name}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm font-medium tabular">
                      {formatPrice(p.price, locale)} {t("common.currency")}
                    </TableCell>
                    <TableCell><ModerationBadge status={p.moderation} /></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {p.moderation !== "published" && (
                          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-success" onClick={() => setModeration(p.id, "published", t("admin.products.approve"))}>
                            <Check className="size-3.5" /> {t("admin.products.approve")}
                          </Button>
                        )}
                        {p.moderation !== "rejected" && (
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 text-muted-foreground hover:text-destructive" onClick={() => setModeration(p.id, "rejected", t("admin.products.reject"))}>
                            <X className="size-3.5" /> {t("admin.products.reject")}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">{t("catalog.emptyTitle")}</div>
        )}
      </Card>
    </div>
  );
}
