"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, ImagePlus, X } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  BannerModerateDialog,
  type BannerModerationTarget,
} from "@/components/admin/banner-moderate-dialog";
import { BannerStatusBadge } from "@/components/shared/badges";
import { Pagination } from "@/components/shared/pagination";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import { localeShort, locales, type Locale } from "@/lib/i18n/config";
import { BANNER_ASPECT_CSS, bannerImageUrl, type AdminBanner } from "@/lib/api/banners";
import { useAdminShopBannersControllerList } from "@/lib/api/generated/endpoints/banners-admin/banners-admin";
import type { AdminShopBannersControllerListStatus } from "@/lib/api/generated/schemas";

const TABS = ["pending", "approved", "rejected", "all"] as const satisfies readonly (
  AdminShopBannersControllerListStatus | "all"
)[];

type Tab = (typeof TABS)[number];

const TAB_LABEL: Record<Tab, string> = {
  pending: "admin.shopBanners.tabPending",
  approved: "admin.shopBanners.tabApproved",
  rejected: "admin.shopBanners.tabRejected",
  all: "admin.shopBanners.tabAll",
};

export default function AdminShopBanners() {
  const { t, locale } = useT();

  const [tab, setTab] = useState<Tab>("pending");
  const [page, setPage] = useState(1);
  const [moderating, setModerating] = useState<BannerModerationTarget | null>(null);

  const { data, isLoading, isError } = useAdminShopBannersControllerList(
    { page, limit: 20, status: tab === "all" ? undefined : tab },
    { query: { retry: false } },
  );

  const banners = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={t("admin.shopBanners.title")}
        subtitle={t("admin.shopBanners.subtitle")}
      />

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Tab);
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map((value) => (
            <TabsTrigger key={value} value={value}>
              {t(TAB_LABEL[value])}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.shopBanners.loadFailed")}
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : banners.length === 0 && !isError ? (
        <Card className="flex flex-col items-center gap-3 py-16 text-center text-sm text-muted-foreground">
          <ImagePlus className="size-8 opacity-60" />
          {t(tab === "pending" ? "admin.shopBanners.emptyPending" : "admin.shopBanners.empty")}
        </Card>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("admin.shopBanners.hint")}</p>

          <div className="space-y-3">
            {banners.map((banner) => (
              <BannerCard
                key={banner.id}
                banner={banner}
                locale={locale}
                onDecide={(decision) => setModerating({ banner, decision })}
              />
            ))}
          </div>
        </>
      )}

      <Pagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onChange={setPage}
      />

      <BannerModerateDialog target={moderating} onClose={() => setModerating(null)} />
    </div>
  );
}

function BannerCard({
  banner,
  locale,
  onDecide,
}: {
  banner: AdminBanner;
  locale: Locale;
  onDecide: (decision: "approved" | "rejected") => void;
}) {
  const { t } = useT();

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <BannerStatusBadge status={banner.status} />
            <span className="font-medium text-foreground">{banner.title}</span>
            {banner.shopId !== null && (
              <Link
                href={`/store/${banner.shopId}`}
                className="hover:text-foreground hover:underline"
              >
                {banner.shopName}
              </Link>
            )}
            {banner.createdAt && (
              <span className="tabular">· {formatDate(banner.createdAt, locale)}</span>
            )}
          </div>

          {}
          <div className="flex flex-wrap gap-2">
            {locales.map((loc) => (
              <div key={loc} className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">{localeShort[loc]}</p>
                <div
                  style={{ aspectRatio: BANNER_ASPECT_CSS }}
                  className="w-44 overflow-hidden rounded-lg border border-border bg-muted"
                >
                  <img
                    src={bannerImageUrl(banner, loc) ?? ""}
                    alt={`${banner.title} · ${localeShort[loc]}`}
                    className="size-full object-contain"
                    onError={(e) => e.currentTarget.classList.add("opacity-0")}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            {banner.linkUrl ? (
              <p className="truncate text-xs text-muted-foreground">
                {t("admin.shopBanners.link", { url: banner.linkUrl })}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">{t("admin.shopBanners.noLink")}</p>
            )}
            {banner.status === "rejected" && banner.rejectReason && (
              <p className="text-xs text-destructive">
                {t("admin.shopBanners.rejectReason", {
                  reason: banner.rejectReason,
                })}
              </p>
            )}
            {banner.moderatedAt && (
              <p className="tabular text-xs text-muted-foreground">
                {t("admin.shopBanners.moderatedAt", {
                  date: formatDate(banner.moderatedAt, locale),
                })}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {banner.status !== "approved" && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-success"
              onClick={() => onDecide("approved")}
            >
              <Check className="size-3.5" />
              {t("admin.shopBanners.approve")}
            </Button>
          )}
          {banner.status !== "rejected" && (
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-muted-foreground hover:text-destructive"
              onClick={() => onDecide("rejected")}
            >
              <X className="size-3.5" />
              {t("admin.shopBanners.reject")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
