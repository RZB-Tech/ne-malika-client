"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, ExternalLink, MoreHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { AbolishDialog } from "@/components/admin/abolish-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  useAdminShopsControllerAbolish,
  useAdminShopsControllerList,
  useAdminShopsControllerRestore,
} from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import type { AdminShopRow } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const statusStyle: Record<AdminShopRow["status"], string> = {
  active: "bg-success/12 text-success",
  hidden: "bg-warning/15 text-warning",
  abolished: "bg-destructive/12 text-destructive",
};

const statusLabel: Record<AdminShopRow["status"], string> = {
  active: "Активен",
  hidden: "Скрыт",
  abolished: "Упразднён",
};

export default function AdminSellers() {
  const { t, locale } = useT();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useAdminShopsControllerList({
    query: {
      select: (raw) => raw as unknown as AdminShopRow[],
      retry: false,
    },
  });

  const abolishMutation = useAdminShopsControllerAbolish();
  const restoreMutation = useAdminShopsControllerRestore();

  const rows = data ?? [];

  const abolish = async (id: number, reason: string) => {
    await abolishMutation.mutateAsync({ id, data: { reason } });
    await queryClient.invalidateQueries();
    toast.success("Магазин упразднён");
  };

  const restore = async (id: number) => {
    await restoreMutation.mutateAsync({ id });
    await queryClient.invalidateQueries();
    toast.success("Магазин возвращён в работу");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.sellers.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.sellers.subtitle")}
        </p>
      </div>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить магазины. Раздел доступен только администраторам.
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">
                  {t("admin.sellers.colStore")}
                </TableHead>
                <TableHead>Контакт</TableHead>
                <TableHead className="text-right">
                  {t("admin.sellers.colProducts")}
                </TableHead>
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
                      <StoreAvatar
                        name={s.name}
                        hue={hueFromId(s.id)}
                        src={photoUrl(s.photo)}
                        className="size-9 rounded-lg text-sm"
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/store/${s.id}`}
                          className="text-sm font-medium hover:text-primary"
                        >
                          {s.name}
                        </Link>
                        {s.abolishReason && (
                          <div className="text-xs text-destructive">
                            {s.abolishReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {s.contact}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular">
                    {s.productCount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        "border-transparent font-medium",
                        statusStyle[s.status],
                      )}
                    >
                      {statusLabel[s.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular">
                    {formatDate(s.createdAt, locale)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/store/${s.id}`}>
                            <ExternalLink className="size-4" />{" "}
                            {t("product.goToStore")}
                          </Link>
                        </DropdownMenuItem>
                        {s.status === "active" ? (
                          <AbolishDialog
                            title="Упразднить магазин"
                            description={s.name}
                            onConfirm={(reason) => abolish(s.id, reason)}
                          >
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Ban className="size-4" />{" "}
                              {t("admin.sellers.block")}
                            </DropdownMenuItem>
                          </AbolishDialog>
                        ) : (
                          <DropdownMenuItem onClick={() => restore(s.id)}>
                            <RotateCcw className="size-4" />{" "}
                            {t("admin.sellers.unblock")}
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
        {isLoading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            Магазинов пока нет.
          </div>
        )}
      </Card>
    </div>
  );
}
