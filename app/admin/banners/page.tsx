"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { BannerFormDialog } from "@/components/admin/banner-form-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useT } from "@/components/providers/i18n-provider";
import {
  BANNER_ASPECT_CSS,
  BANNER_FORMATS_LABEL,
  bannerExpired,
  type Banner,
} from "@/lib/api/banners";
import { photoUrl } from "@/lib/api/photo";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Paginated, AdminShopRow } from "@/lib/api/types";
import { devFallbackPage, devShops } from "@/lib/api/dev-fixtures";
import { useAdminShopsControllerList } from "@/lib/api/generated/endpoints/shops-admin/shops-admin";
import {
  getAdminBannersControllerFindAllQueryKey,
  useAdminBannersControllerFindAll,
  useAdminBannersControllerRemove,
  useAdminBannersControllerReorder,
  useAdminBannersControllerUpdate,
} from "@/lib/api/generated/endpoints/banners-admin/banners-admin";

export default function AdminBanners() {
  const { t, locale } = useT();
  const run = useAdminMutation();

  const [editing, setEditing] = useState<Banner | null | undefined>(undefined);

  const { data, isLoading, isError } = useAdminBannersControllerFindAll({
    query: { retry: false },
  });

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

  const updateBanner = useAdminBannersControllerUpdate();
  const removeBanner = useAdminBannersControllerRemove();
  const reorderBanners = useAdminBannersControllerReorder();

  const banners = data ?? [];

  const toggleActive = (banner: Banner, isActive: boolean) =>
    run(() => updateBanner.mutateAsync({ id: banner.id, data: { isActive } }), {
      invalidate: [getAdminBannersControllerFindAllQueryKey()],
      errorKey: "admin.banners.saveFailed",
    });

  const onRemove = (id: number) =>
    run(() => removeBanner.mutateAsync({ id }), {
      invalidate: [getAdminBannersControllerFindAllQueryKey()],
      successKey: "admin.banners.removed",
      errorKey: "admin.banners.saveFailed",
    });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= banners.length) return Promise.resolve();
    const ids = banners.map((b) => b.id);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    return run(() => reorderBanners.mutateAsync({ data: { ids } }), {
      invalidate: [getAdminBannersControllerFindAllQueryKey()],
      errorKey: "admin.banners.saveFailed",
    });
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.banners.title")}
        subtitle={t("admin.banners.subtitle", { sizes: BANNER_FORMATS_LABEL })}
        actions={
          <Button onClick={() => setEditing(null)}>
            <Plus data-icon="inline-start" />
            {t("admin.banners.add")}
          </Button>
        }
      />

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.banners.loadFailed")}
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : banners.length === 0 && !isError ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
          <ImagePlus className="size-8 opacity-60" />
          {t("admin.banners.empty")}
        </Card>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, i) => (
            <Card key={banner.id} className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex shrink-0 flex-col gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    disabled={i === 0 || reorderBanners.isPending}
                    onClick={() => move(i, i - 1)}
                    aria-label={t("admin.banners.moveUp")}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    disabled={i === banners.length - 1 || reorderBanners.isPending}
                    onClick={() => move(i, i + 1)}
                    aria-label={t("admin.banners.moveDown")}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>

                <div
                  style={{ aspectRatio: BANNER_ASPECT_CSS }}
                  className="w-44 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <img
                    src={photoUrl(banner.photoRu) ?? ""}
                    alt={banner.title}
                    className="size-full object-contain"
                    onError={(e) => e.currentTarget.classList.add("opacity-0")}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{banner.title}</p>
                    {!banner.isActive && (
                      <Badge variant="secondary">{t("admin.banners.hidden")}</Badge>
                    )}
                  </div>
                  {banner.expiresAt && (
                    <p
                      className={cn(
                        "tabular mt-1 text-xs",
                        bannerExpired(banner) ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {t(bannerExpired(banner) ? "admin.banners.expired" : "admin.banners.until", {
                        date: formatDate(banner.expiresAt, locale),
                      })}
                    </p>
                  )}

                  {banner.linkUrl ? (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      {banner.linkUrl}
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("admin.banners.noLink")}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Switch
                    checked={banner.isActive}
                    onCheckedChange={(v) => toggleActive(banner, v)}
                    aria-label={t("admin.banners.active")}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5"
                    onClick={() => setEditing(banner)}
                  >
                    <Pencil className="size-3.5" />
                    {t("common.edit")}
                  </Button>
                  <ConfirmDialog
                    title={t("admin.banners.removeTitle")}
                    description={t("admin.banners.removeText")}
                    confirmLabel={t("common.delete")}
                    destructive
                    onConfirm={() => onRemove(banner.id)}
                  >
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </ConfirmDialog>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <BannerFormDialog
        target={editing}
        shops={shops}
        onOpenChange={(open) => !open && setEditing(undefined)}
      />
    </div>
  );
}
