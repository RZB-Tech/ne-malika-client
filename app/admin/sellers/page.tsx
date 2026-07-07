"use client";

import Link from "next/link";
import { useState } from "react";
import { Ban, Check, ExternalLink, MoreHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import { stores as initialStores, storeProductCount, type SellerStatus } from "@/lib/data";
import { cn } from "@/lib/utils";

const statusStyle: Record<SellerStatus, string> = {
  active: "bg-success/12 text-success",
  pending: "bg-warning/15 text-warning",
  blocked: "bg-destructive/12 text-destructive",
};

export default function AdminSellers() {
  const { t, locale } = useT();
  const [rows, setRows] = useState(initialStores);

  const setStatus = (id: string, status: SellerStatus, msg: string) => {
    setRows((r) => r.map((s) => (s.id === id ? { ...s, status } : s)));
    const s = rows.find((x) => x.id === id);
    toast.success(msg, { description: s?.name });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.sellers.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.sellers.subtitle")}</p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">{t("admin.sellers.colStore")}</TableHead>
                <TableHead>{t("admin.sellers.colCity")}</TableHead>
                <TableHead className="text-right">{t("admin.sellers.colProducts")}</TableHead>
                <TableHead>{t("admin.sellers.colStatus")}</TableHead>
                <TableHead>{t("admin.sellers.colJoined")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span
                        className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
                        style={{ background: `oklch(0.55 0.17 ${s.logoHue})` }}
                      >
                        {s.name.slice(0, 1)}
                      </span>
                      <div className="min-w-0">
                        <Link href={`/store/${s.slug}`} className="text-sm font-medium hover:text-primary">
                          {s.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">@{s.telegram}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.city}</TableCell>
                  <TableCell className="text-right text-sm tabular">{storeProductCount(s.id)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("border-transparent font-medium", statusStyle[s.status])}>
                      {t(`admin.sellers.${s.status}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular">
                    {formatDate(s.joined, locale)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/store/${s.slug}`}><ExternalLink className="size-4" /> {t("product.goToStore")}</Link>
                        </DropdownMenuItem>
                        {s.status !== "active" && (
                          <DropdownMenuItem onClick={() => setStatus(s.id, "active", t("admin.sellers.approve"))}>
                            <Check className="size-4" /> {s.status === "pending" ? t("admin.sellers.approve") : t("admin.sellers.unblock")}
                          </DropdownMenuItem>
                        )}
                        {s.status === "blocked" ? (
                          <DropdownMenuItem onClick={() => setStatus(s.id, "active", t("admin.sellers.unblock"))}>
                            <RotateCcw className="size-4" /> {t("admin.sellers.unblock")}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem variant="destructive" onClick={() => setStatus(s.id, "blocked", t("admin.sellers.block"))}>
                            <Ban className="size-4" /> {t("admin.sellers.block")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
