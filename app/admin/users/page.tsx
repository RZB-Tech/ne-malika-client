"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff, Store, UserX, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserDrawer } from "@/components/admin/user-drawer";
import { Pagination } from "@/components/shared/pagination";
import {
  RowActionsMenu,
  RowContextMenu,
  type RowAction,
} from "@/components/admin/row-actions";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  useAdminUsersControllerBlock,
  useAdminUsersControllerList,
  useAdminUsersControllerSetRole,
  useAdminUsersControllerUnblock,
} from "@/lib/api/generated/endpoints/users-admin/users-admin";
import {
  devFallbackPage,
  devUsers,
  usingDevData,
} from "@/lib/api/dev-fixtures";
import type { AdminUserRow, Paginated } from "@/lib/api/types";

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function AdminUsers() {
  const { locale } = useT();
  const queryClient = useQueryClient();
  const [opened, setOpened] = useState<AdminUserRow | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminUsersControllerList(
    { page, limit: 20 },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AdminUserRow>,
        retry: false,
      },
    },
  );

  const blockMutation = useAdminUsersControllerBlock();
  const unblockMutation = useAdminUsersControllerUnblock();
  const roleMutation = useAdminUsersControllerSetRole();

  const pageData = devFallbackPage(data, devUsers);
  const rows = pageData.data;
  const isDevData = usingDevData(data?.data);

  const done = async (message: string) => {
    await queryClient.invalidateQueries();
    setOpened(null);
    toast.success(message);
  };

  const block = async (id: number, reason: string) => {
    await blockMutation.mutateAsync({ id, data: { reason } });
    await done("Пользователь заблокирован");
  };
  const unblock = async (id: number) => {
    await unblockMutation.mutateAsync({ id });
    await done("Блокировка снята");
  };
  const setRole = async (id: number, role: "admin" | "seller") => {
    await roleMutation.mutateAsync({ id, data: { role } });
    await done(role === "admin" ? "Выданы права админа" : "Права админа сняты");
  };

  const actionsFor = (u: AdminUserRow): RowAction[] => [
    ...(u.shopId
      ? [
          {
            label: "Открыть магазин",
            icon: Store,
            href: `/store/${u.shopId}`,
          } satisfies RowAction,
        ]
      : []),
    u.role === "admin"
      ? {
          label: "Снять права админа",
          icon: ShieldOff,
          onSelect: () => void setRole(u.id, "seller"),
        }
      : {
          label: "Сделать администратором",
          icon: ShieldCheck,
          onSelect: () => void setRole(u.id, "admin"),
        },
    u.blockedAt
      ? {
          label: "Разблокировать",
          icon: RotateCcw,
          onSelect: () => void unblock(u.id),
        }
      : {
          label: "Заблокировать",
          icon: UserX,
          destructive: true,
          withReason: {
            title: "Заблокировать пользователя",
            description: "Вход в кабинет будет закрыт. Причина видна при входе.",
            onConfirm: (reason) => block(u.id, reason),
          },
        },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          Пользователи
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Нажмите на строку, чтобы посмотреть карточку и последние действия.
          Правая кнопка мыши — быстрые действия.
        </p>
      </div>

      {isError && !isDevData && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          Не удалось загрузить пользователей.
        </Card>
      )}

      {isDevData && (
        <Card className="bg-muted/50 p-4 text-sm text-muted-foreground">
          Показаны тестовые данные: бэкенд недоступен.
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">Пользователь</TableHead>
                <TableHead>Магазин</TableHead>
                <TableHead>Роль</TableHead>
                <TableHead className="text-right">Товаров</TableHead>
                <TableHead>Регистрация</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((u) => (
                <RowContextMenu key={u.id} actions={actionsFor(u)}>
                  <TableRow
                    onClick={() => setOpened(u)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarImage src={u.telegramPhoto ?? undefined} />
                          <AvatarFallback>
                            {initials(u.fullname)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            {u.fullname}
                            {u.blockedAt && (
                              <Badge
                                variant="outline"
                                className="border-transparent bg-destructive/12 text-xs font-medium text-destructive"
                              >
                                заблокирован
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {u.telegramUsername
                              ? `@${u.telegramUsername}`
                              : u.phoneNumber ?? "—"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.shopName ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          u.role === "admin"
                            ? "border-transparent bg-primary/12 font-medium text-primary"
                            : "border-transparent bg-muted font-medium text-muted-foreground"
                        }
                      >
                        {u.role === "admin" ? "Администратор" : "Продавец"}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular text-right text-sm">
                      {u.productCount}
                    </TableCell>
                    <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(u.createdAt, locale)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActionsMenu actions={actionsFor(u)} />
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
            Пользователей пока нет.
          </div>
        )}
      </Card>

      <Pagination
        page={pageData.meta.page}
        totalPages={pageData.meta.totalPages}
        total={pageData.meta.total}
        onChange={setPage}
      />

      <UserDrawer
        user={opened}
        onOpenChange={(open) => !open && setOpened(null)}
        onBlock={block}
        onUnblock={unblock}
        onSetRole={setRole}
      />
    </div>
  );
}
