"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck, ShieldOff, Store, UserX, RotateCcw } from "@/components/icons";
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
import { RoleBadge } from "@/components/shared/badges";
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
import type { AdminUserRow, Paginated, UserRole } from "@/lib/api/types";

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
  const { t, locale } = useT();
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
    await done(t("admin.users.blocked"));
  };
  const unblock = async (id: number) => {
    await unblockMutation.mutateAsync({ id });
    await done(t("admin.users.unblocked"));
  };
  const setRole = async (id: number, role: UserRole) => {
    await roleMutation.mutateAsync({ id, data: { role } });
    await done(
      t(role === "admin" ? "admin.users.adminGranted" : "admin.users.adminRevoked"),
    );
  };

  // Снимая админа, возвращаем ту роль, которой человек соответствует: продавец
  // без магазина — это просто покупатель.
  const demotedRole = (u: { shopId: number | null }): UserRole =>
    u.shopId ? "seller" : "user";

  const actionsFor = (u: AdminUserRow): RowAction[] => [
    ...(u.shopId
      ? [
          {
            label: t("admin.users.openShop"),
            icon: Store,
            href: `/store/${u.shopId}`,
          } satisfies RowAction,
        ]
      : []),
    u.role === "admin"
      ? {
          label: t("admin.users.dropAdmin"),
          icon: ShieldOff,
          onSelect: () => void setRole(u.id, demotedRole(u)),
        }
      : {
          label: t("admin.users.makeAdmin"),
          icon: ShieldCheck,
          onSelect: () => void setRole(u.id, "admin"),
        },
    u.blockedAt
      ? {
          label: t("admin.users.unblock"),
          icon: RotateCcw,
          onSelect: () => void unblock(u.id),
        }
      : {
          label: t("admin.users.block"),
          icon: UserX,
          destructive: true,
          withReason: {
            title: t("admin.users.blockTitle"),
            description: t("admin.users.blockText"),
            onConfirm: (reason) => block(u.id, reason),
          },
        },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.users.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.users.subtitle")}
        </p>
      </div>

      {isError && !isDevData && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.users.loadFailed")}
        </Card>
      )}

      {isDevData && (
        <Card className="bg-muted/50 p-4 text-sm text-muted-foreground">
          {t("admin.common.devDataShort")}
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">
                  {t("admin.users.colUser")}
                </TableHead>
                <TableHead>{t("admin.users.colShop")}</TableHead>
                <TableHead>{t("admin.users.colRole")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.users.colProducts")}
                </TableHead>
                <TableHead>{t("admin.users.colJoined")}</TableHead>
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
                                {t("admin.common.blocked")}
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
                      <RoleBadge role={u.role} />
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
            {t("admin.users.empty")}
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
