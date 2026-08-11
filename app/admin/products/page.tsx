"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  ExternalLink,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Pagination } from "@/components/shared/pagination";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import {
  RowActionsMenu,
  RowContextMenu,
  type RowAction,
} from "@/components/admin/row-actions";
import { ProductDrawer } from "@/components/admin/product-drawer";
import {
  ProductFormDialog,
  type ProductFormTarget,
} from "@/components/admin/product-form-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { formatPrice } from "@/lib/format";
import {
  useAdminProductCardsControllerAbolish,
  useAdminProductCardsControllerFindAll,
  useAdminProductCardsControllerRemove,
  useAdminProductCardsControllerRestore,
} from "@/lib/api/generated/endpoints/product-cards-admin/product-cards-admin";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { useAdminShopsControllerList } from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import {
  devAdminProducts,
  devFallbackPage,
  devShops,
  usingDevData,
} from "@/lib/api/dev-fixtures";
import type {
  AdminProductRow,
  AdminShopRow,
  EntityStatus,
  Paginated,
} from "@/lib/api/types";

/** Вкладки фильтра. `undefined` — без параметра, то есть все статусы. */
const TABS: { value: string; labelKey: string; status?: EntityStatus }[] = [
  { value: "all", labelKey: "admin.productList.tabAll" },
  { value: "active", labelKey: "admin.productList.tabActive", status: "active" },
  {
    value: "pending",
    labelKey: "admin.productList.tabPending",
    status: "pending",
  },
  { value: "hidden", labelKey: "admin.productList.tabHidden", status: "hidden" },
  {
    value: "abolished",
    labelKey: "admin.productList.tabAbolished",
    status: "abolished",
  },
];

export default function AdminProducts() {
  const { t, locale } = useT();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<AdminProductRow | null>(null);
  const [form, setForm] = useState<ProductFormTarget | null>(null);

  const status = TABS.find((x) => x.value === tab)?.status;

  const { data, isLoading } = useAdminProductCardsControllerFindAll(
    { page, limit: 20, q: q.trim() || undefined, status },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AdminProductRow>,
        retry: false,
      },
    },
  );

  const shopsQuery = useAdminShopsControllerList(
    { limit: 100 },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AdminShopRow>,
        retry: false,
      },
    },
  );
  const shops = devFallbackPage(shopsQuery.data, devShops).data;

  const abolishMutation = useAdminProductCardsControllerAbolish();
  const restoreMutation = useAdminProductCardsControllerRestore();
  const removeMutation = useAdminProductCardsControllerRemove();

  const pageData = useMemo(() => {
    const fixtures = devAdminProducts.filter(
      (p) =>
        (!status || p.status === status) &&
        (!q.trim() || p.name.toLowerCase().includes(q.trim().toLowerCase())),
    );
    return devFallbackPage(data, fixtures);
  }, [data, status, q]);

  const rows = pageData.data;

  const isDevData = usingDevData(data?.data);

  const abolish = async (id: number, reason: string) => {
    await abolishMutation.mutateAsync({ id, data: { reason } });
    await queryClient.invalidateQueries();
    setOpened(null);
    toast.success(t("admin.productList.abolished"));
  };

  const restore = async (id: number) => {
    await restoreMutation.mutateAsync({ id });
    await queryClient.invalidateQueries();
    setOpened(null);
    toast.success(t("admin.productList.restored"));
  };

  const remove = async (id: number) => {
    await removeMutation.mutateAsync({ id });
    await queryClient.invalidateQueries();
    setOpened(null);
    toast.success(t("admin.productList.removed"));
  };

  /** Один набор действий и для трёх точек, и для правой кнопки мыши. */
  const actionsFor = (p: AdminProductRow): RowAction[] => [
    {
      label: t("admin.productList.edit"),
      icon: Pencil,
      onSelect: () => setForm({ product: p }),
    },
    {
      label: t("admin.productList.openOnSite"),
      icon: ExternalLink,
      href: `/product/${p.id}`,
    },
    p.status === "active"
      ? {
          label: t("admin.common.abolish"),
          icon: Ban,
          destructive: true,
          withReason: {
            title: t("admin.productList.abolishTitle"),
            description: t("admin.productList.abolishText"),
            onConfirm: (reason) => abolish(p.id, reason),
          },
        }
      : {
          label: t("admin.productList.restore"),
          icon: RotateCcw,
          onSelect: () => void restore(p.id),
        },
    {
      label: t("admin.productList.remove"),
      icon: Trash2,
      destructive: true,
      withConfirm: {
        title: t("admin.productList.removeTitle"),
        description: t("admin.productList.removeText", { name: p.name }),
        confirmLabel: t("admin.productList.remove"),
        onConfirm: () => remove(p.id),
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.products.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.productList.hint")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          className="order-last sm:order-none"
          onClick={() => setForm({ product: null })}
        >
          <Plus className="size-4" /> {t("admin.productList.newProduct")}
        </Button>

        <Tabs
          value={tab}
          onValueChange={(v) => {
            setTab(v);
            setPage(1);
          }}
        >
          <TabsList>
            {TABS.map((x) => (
              <TabsTrigger key={x.value} value={x.value}>
                {t(x.labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder={t("admin.productList.search")}
            className="pl-9"
          />
        </div>
      </div>

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
                <TableHead className="min-w-[260px]">
                  {t("admin.products.colProduct")}
                </TableHead>
                <TableHead>{t("admin.products.colStore")}</TableHead>
                <TableHead>{t("admin.productList.colStatus")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.products.colPrice")}
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                <RowContextMenu key={p.id} actions={actionsFor(p)}>
                  <TableRow onClick={() => setOpened(p)} className="cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductImage
                        hue={hueFromId(p.id)}
                        categorySlug=""
                        src={photoUrl(p.photos?.[0])}
                        alt={p.name}
                        className="size-10 shrink-0 rounded-lg"
                        iconClassName="size-4"
                      />
                      <div className="min-w-0">
                        <div className="line-clamp-1 text-sm font-medium">
                          {p.name}
                        </div>
                        {p.abolishReason && (
                          <div className="line-clamp-1 text-xs text-destructive">
                            {p.abolishReason}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {p.shopName}
                  </TableCell>
                  <TableCell>
                    <EntityStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="tabular whitespace-nowrap text-right text-sm font-medium">
                    {formatPrice(Number(p.price), locale)} {t("common.currency")}
                  </TableCell>
                  {/* Клик по меню не должен открывать ящик со всей карточкой. */}
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <RowActionsMenu actions={actionsFor(p)} />
                  </TableCell>
                  </TableRow>
                </RowContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {t("common.nothingFound")}
          </div>
        )}
      </Card>

      <Pagination
        page={pageData.meta.page}
        totalPages={pageData.meta.totalPages}
        total={pageData.meta.total}
        onChange={setPage}
      />

      <ProductDrawer
        product={opened}
        onOpenChange={(open) => !open && setOpened(null)}
        onAbolish={abolish}
        onRestore={restore}
        onRemove={(id) => remove(id)}
        onEdit={(p) => {
          setOpened(null);
          setForm({ product: p });
        }}
      />

      <ProductFormDialog
        target={form}
        shops={shops}
        onOpenChange={(open) => !open && setForm(null)}
      />
    </div>
  );
}
