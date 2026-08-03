"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  ExternalLink,
  RotateCcw,
  Search,
  Trash2,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { StoreAvatar } from "@/components/shared/store-avatar";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import { Pagination } from "@/components/shared/pagination";
import { ShopDrawer } from "@/components/admin/shop-drawer";
import {
  RowActionsMenu,
  RowContextMenu,
  type RowAction,
} from "@/components/admin/row-actions";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  useAdminShopsControllerAbolish,
  useAdminShopsControllerList,
  useAdminShopsControllerRemove,
  useAdminShopsControllerRestore,
} from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import {
  useAdminUsersControllerBlock,
  useAdminUsersControllerUnblock,
} from "@/lib/api/generated/endpoints/users-admin/users-admin";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import {
  devFallbackPage,
  devShops,
  usingDevData,
} from "@/lib/api/dev-fixtures";
import type { AdminShopRow, Paginated } from "@/lib/api/types";

export default function AdminSellers() {
  const { t, locale } = useT();
  const queryClient = useQueryClient();
  const [opened, setOpened] = useState<AdminShopRow | null>(null);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const { data, isLoading, isError } = useAdminShopsControllerList(
    { page, limit: 20, q: q.trim() || undefined },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AdminShopRow>,
        retry: false,
      },
    },
  );

  const abolishMutation = useAdminShopsControllerAbolish();
  const restoreMutation = useAdminShopsControllerRestore();
  const removeMutation = useAdminShopsControllerRemove();
  const blockMutation = useAdminUsersControllerBlock();
  const unblockMutation = useAdminUsersControllerUnblock();

  const pageData = useMemo(() => {
    // Фикстуры фильтруем на клиенте — иначе поиск локально не проверить.
    const needle = q.trim().toLowerCase();
    const fixtures = needle
      ? devShops.filter((s) =>
          [s.name, s.ownerName, s.contact, s.address ?? ""].some((v) =>
            v.toLowerCase().includes(needle),
          ),
        )
      : devShops;
    return devFallbackPage(data, fixtures);
  }, [data, q]);
  const rows = pageData.data;
  const isDevData = usingDevData(data?.data);

  const done = async (message: string) => {
    await queryClient.invalidateQueries();
    setOpened(null);
    toast.success(message);
  };

  const abolish = async (id: number, reason: string) => {
    await abolishMutation.mutateAsync({ id, data: { reason } });
    await done("Магазин упразднён");
  };
  const restore = async (id: number) => {
    await restoreMutation.mutateAsync({ id });
    await done("Магазин возвращён в работу");
  };
  const blockOwner = async (ownerId: number, reason: string) => {
    await blockMutation.mutateAsync({ id: ownerId, data: { reason } });
    await done("Продавец заблокирован");
  };
  const unblockOwner = async (ownerId: number) => {
    await unblockMutation.mutateAsync({ id: ownerId });
    await done("Блокировка снята");
  };
  // Переспрашивает вызывающая сторона — ConfirmDialog в меню и в карточке.
  const remove = async (id: number) => {
    await removeMutation.mutateAsync({ id });
    await done("Магазин удалён, владелец снова покупатель");
  };

  /** Один набор действий и для трёх точек, и для правой кнопки мыши. */
  const actionsFor = (shop: AdminShopRow): RowAction[] => [
    { label: "Открыть профиль", icon: ExternalLink, href: `/store/${shop.id}` },
    shop.status === "active"
      ? {
          label: "Упразднить магазин",
          icon: Ban,
          destructive: true,
          withReason: {
            title: "Упразднить магазин",
            description:
              "Магазин и его товары исчезнут из выдачи. Причина видна продавцу.",
            onConfirm: (reason) => abolish(shop.id, reason),
          },
        }
      : {
          label: "Вернуть магазин",
          icon: RotateCcw,
          onSelect: () => void restore(shop.id),
        },
    shop.ownerBlockedAt
      ? {
          label: "Разблокировать продавца",
          icon: RotateCcw,
          onSelect: () => void unblockOwner(shop.ownerId),
        }
      : {
          label: "Заблокировать продавца",
          icon: UserX,
          destructive: true,
          withReason: {
            title: "Заблокировать продавца",
            description:
              "Владелец не сможет войти в кабинет и создать новый магазин.",
            onConfirm: (reason) => blockOwner(shop.ownerId, reason),
          },
        },
    {
      label: "Удалить магазин",
      icon: Trash2,
      destructive: true,
      withConfirm: {
        title: "Удалить магазин?",
        description: `«${shop.name}» и все его товары (${shop.productCount}) исчезнут навсегда, владелец снова станет покупателем. Если нужна обратимая блокировка — используйте «Упразднить».`,
        confirmLabel: "Удалить",
        onConfirm: () => remove(shop.id),
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.sellers.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Нажмите на строку, чтобы открыть карточку. Правая кнопка мыши —
          быстрые действия.
        </p>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Поиск по магазину или владельцу"
          className="pl-9"
        />
      </div>

      {isError && !isDevData && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить магазины. Раздел доступен только администраторам.
        </Card>
      )}

      {isDevData && (
        <Card className="bg-muted/50 p-4 text-sm text-muted-foreground">
          Показаны тестовые данные: бэкенд недоступен. Запустите его, чтобы
          увидеть настоящие.
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
                <TableHead>Владелец</TableHead>
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
                <RowContextMenu key={s.id} actions={actionsFor(s)}>
                  <TableRow
                    onClick={() => setOpened(s)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StoreAvatar
                          name={s.name}
                          hue={hueFromId(s.id)}
                          src={photoUrl(s.photo)}
                          className="size-9 rounded-lg text-sm"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{s.name}</div>
                          {s.abolishReason && (
                            <div className="line-clamp-1 text-xs text-destructive">
                              {s.abolishReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{s.ownerName}</span>
                        {s.ownerBlockedAt && (
                          <Badge
                            variant="outline"
                            className="border-transparent bg-destructive/12 text-xs font-medium text-destructive"
                          >
                            заблокирован
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {s.contact}
                      </div>
                    </TableCell>
                    <TableCell className="tabular text-right text-sm">
                      {s.productCount}
                    </TableCell>
                    <TableCell>
                      <EntityStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(s.createdAt, locale)}
                    </TableCell>
                    {/* Клик по меню не должен открывать карточку. */}
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActionsMenu actions={actionsFor(s)} />
                    </TableCell>
                  </TableRow>
                </RowContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>
        {isLoading && (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {q.trim() ? "Ничего не нашлось." : "Магазинов пока нет."}
          </div>
        )}
      </Card>

      <Pagination
        page={pageData.meta.page}
        totalPages={pageData.meta.totalPages}
        total={pageData.meta.total}
        onChange={setPage}
      />

      <ShopDrawer
        shop={opened}
        onOpenChange={(open) => !open && setOpened(null)}
        onAbolish={abolish}
        onRestore={restore}
        onBlockOwner={blockOwner}
        onUnblockOwner={unblockOwner}
        onRemove={remove}
      />
    </div>
  );
}
