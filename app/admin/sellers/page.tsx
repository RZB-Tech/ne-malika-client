"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Coins,
  ExternalLink,
  Lock,
  RotateCcw,
  Search,
  Trash2,
  UserX,
} from "@/components/icons";
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
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import { Pagination } from "@/components/shared/pagination";
import { ShopDrawer } from "@/components/admin/shop-drawer";
import { CreditsDialog } from "@/components/admin/credits-dialog";
import { RowActionsMenu, RowContextMenu, type RowAction } from "@/components/admin/row-actions";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  getAdminShopsControllerListQueryKey,
  useAdminShopsControllerAbolish,
  useAdminShopsControllerList,
  useAdminShopsControllerRemove,
  useAdminShopsControllerRestore,
  useAdminShopsControllerSetRestrictedCategories,
} from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import {
  getAdminUsersControllerListQueryKey,
  useAdminUsersControllerBlock,
  useAdminUsersControllerUnblock,
} from "@/lib/api/generated/endpoints/users-admin/users-admin";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { devFallbackPage, devShops, usingDevData } from "@/lib/api/dev-fixtures";
import type { AdminShopRow, Paginated } from "@/lib/api/types";

export default function AdminSellers() {
  const { t, locale } = useT();
  const run = useAdminMutation();
  const [opened, setOpened] = useState<AdminShopRow | null>(null);
  const [creditsShop, setCreditsShop] = useState<{
    id: number;
    name: string;
  } | null>(null);
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
  const restrictedMutation = useAdminShopsControllerSetRestrictedCategories();
  const blockMutation = useAdminUsersControllerBlock();
  const unblockMutation = useAdminUsersControllerUnblock();

  const pageData = useMemo(() => {
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

  const abolish = async (id: number, reason: string) => {
    const ok = await run(() => abolishMutation.mutateAsync({ id, data: { reason } }), {
      invalidate: [getAdminShopsControllerListQueryKey()],
      successKey: "admin.shops.abolished",
      errorKey: "common.actionFailed",
    });
    if (ok) setOpened(null);
  };
  const restore = async (id: number) => {
    const ok = await run(() => restoreMutation.mutateAsync({ id }), {
      invalidate: [getAdminShopsControllerListQueryKey()],
      successKey: "admin.shops.restored",
      errorKey: "common.actionFailed",
    });
    if (ok) setOpened(null);
  };
  const blockOwner = async (ownerId: number, reason: string) => {
    const ok = await run(() => blockMutation.mutateAsync({ id: ownerId, data: { reason } }), {
      invalidate: [getAdminShopsControllerListQueryKey(), getAdminUsersControllerListQueryKey()],
      successKey: "admin.shops.ownerBlocked",
      errorKey: "common.actionFailed",
    });
    if (ok) setOpened(null);
  };
  const unblockOwner = async (ownerId: number) => {
    const ok = await run(() => unblockMutation.mutateAsync({ id: ownerId }), {
      invalidate: [getAdminShopsControllerListQueryKey(), getAdminUsersControllerListQueryKey()],
      successKey: "admin.shops.ownerUnblocked",
      errorKey: "common.actionFailed",
    });
    if (ok) setOpened(null);
  };
  const setRestricted = async (id: number, enabled: boolean) => {
    const ok = await run(() => restrictedMutation.mutateAsync({ id, data: { enabled } }), {
      invalidate: [getAdminShopsControllerListQueryKey()],
      successKey: enabled ? "admin.shops.restrictedGranted" : "admin.shops.restrictedRevoked",
      errorKey: "admin.shops.restrictedFailed",
    });
    if (ok) setOpened(null);
  };
  const remove = async (id: number) => {
    const ok = await run(() => removeMutation.mutateAsync({ id }), {
      invalidate: [getAdminShopsControllerListQueryKey()],
      successKey: "admin.shops.removed",
      errorKey: "common.actionFailed",
    });
    if (ok) setOpened(null);
  };

  const actionsFor = (shop: AdminShopRow): RowAction[] => [
    {
      label: t("admin.shops.openProfile"),
      icon: ExternalLink,
      href: `/store/${shop.id}`,
    },
    shop.status === "active"
      ? {
          label: t("admin.shops.abolish"),
          icon: Ban,
          destructive: true,
          withReason: {
            title: t("admin.shops.abolish"),
            description: t("admin.shops.abolishText"),
            onConfirm: (reason) => abolish(shop.id, reason),
          },
        }
      : {
          label: t("admin.shops.restore"),
          icon: RotateCcw,
          onSelect: () => void restore(shop.id),
        },
    shop.ownerBlockedAt
      ? {
          label: t("admin.shops.unblockOwner"),
          icon: RotateCcw,
          onSelect: () => void unblockOwner(shop.ownerId),
        }
      : {
          label: t("admin.shops.blockOwner"),
          icon: UserX,
          destructive: true,
          withReason: {
            title: t("admin.shops.blockOwner"),
            description: t("admin.shops.blockOwnerText"),
            onConfirm: (reason) => blockOwner(shop.ownerId, reason),
          },
        },
    {
      label: t("admin.credits.creditsAction"),
      icon: Coins,
      onSelect: () => setCreditsShop({ id: shop.id, name: shop.name }),
    },
    shop.restrictedCategoriesEnabled
      ? {
          label: t("admin.shops.restrictedRevoke"),
          icon: Lock,
          onSelect: () => void setRestricted(shop.id, false),
        }
      : {
          label: t("admin.shops.restrictedGrant"),
          icon: Lock,
          onSelect: () => void setRestricted(shop.id, true),
        },
    {
      label: t("admin.shops.remove"),
      icon: Trash2,
      destructive: true,
      withConfirm: {
        title: t("admin.shops.removeTitle"),
        description: t("admin.shops.removeText", {
          name: shop.name,
          count: shop.productCount,
        }),
        confirmLabel: t("admin.productList.remove"),
        onConfirm: () => remove(shop.id),
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("admin.sellers.title")} subtitle={t("admin.common.rowHint")} />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("admin.shops.search")}
          className="pl-9"
        />
      </div>

      {isError && !isDevData && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.shops.loadFailed")}
        </Card>
      )}

      {isDevData && (
        <Card className="bg-muted/50 p-4 text-sm text-muted-foreground">
          {t("admin.common.devData")}
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[220px]">{t("admin.sellers.colStore")}</TableHead>
                <TableHead>{t("admin.shops.colOwner")}</TableHead>
                <TableHead className="text-right">{t("admin.sellers.colProducts")}</TableHead>
                <TableHead>{t("admin.sellers.colStatus")}</TableHead>
                <TableHead>{t("admin.sellers.colJoined")}</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <RowContextMenu key={s.id} actions={actionsFor(s)}>
                  <TableRow onClick={() => setOpened(s)} className="cursor-pointer">
                    <TableCell>
                      <div className="flex max-w-[360px] items-center gap-3">
                        <StoreAvatar
                          name={s.name}
                          hue={hueFromId(s.id)}
                          src={photoUrl(s.photo)}
                          className="size-9 shrink-0 rounded-lg text-sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{s.name}</div>
                          {s.abolishReason && (
                            <div
                              className="truncate text-xs text-destructive"
                              title={s.abolishReason}
                            >
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
                            {t("admin.common.blocked")}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{s.contact}</div>
                    </TableCell>
                    <TableCell className="tabular text-right text-sm">{s.productCount}</TableCell>
                    <TableCell>
                      <EntityStatusBadge status={s.status} />
                    </TableCell>
                    <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(s.createdAt, locale)}
                    </TableCell>
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
            {q.trim() ? t("common.nothingFound") : t("admin.shops.empty")}
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
        onSetRestricted={setRestricted}
        onRemove={remove}
      />

      <CreditsDialog shop={creditsShop} onClose={() => setCreditsShop(null)} />
    </div>
  );
}
