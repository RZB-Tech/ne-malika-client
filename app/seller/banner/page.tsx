"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ExternalLink, ImageIcon, Lock, Trash2 } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BannerStatusBadge } from "@/components/shared/badges";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { BannerForm } from "@/components/seller/banner-form";
import { useT } from "@/components/providers/i18n-provider";
import { BANNER_ASPECT_CSS, bannerImageUrl, type Banner } from "@/lib/api/banners";
import type { BannerModerationStatus } from "@/lib/api/types";
import type { Locale } from "@/lib/i18n/config";
import { useSellerSubscription } from "@/lib/api/subscription";
import {
  getSellerBannersControllerListQueryKey,
  useSellerBannersControllerList,
  useSellerBannersControllerRemove,
} from "@/lib/api/generated/endpoints/banners-seller/banners-seller";

const STATUS_TEXT: Record<BannerModerationStatus, string> = {
  pending: "seller.banner.statusPendingText",
  approved: "seller.banner.statusApprovedText",
  rejected: "seller.banner.statusRejectedText",
};

export default function SellerBanner() {
  const { t, locale } = useT();
  const queryClient = useQueryClient();

  const {
    shop,
    subscription,
    isLoading: subscriptionLoading,
    isError: subscriptionError,
  } = useSellerSubscription();

  const bannersQuery = useSellerBannersControllerList({
    query: { enabled: Boolean(shop), retry: false },
  });
  const removeBanner = useSellerBannersControllerRemove();

  if (subscriptionLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (!shop) {
    redirect("/seller/profile");
  }

  const banners = bannersQuery.data ?? [];

  const banner: Banner | null = banners[0] ?? null;

  const slots = subscription?.bannerSlots ?? 0;
  const locked = slots <= 0;
  const canCreate = banners.length < slots;

  const onRemove = async (id: number) => {
    await removeBanner.mutateAsync({ id });
    await queryClient.invalidateQueries({
      queryKey: getSellerBannersControllerListQueryKey(),
    });
    toast.success(t("seller.banner.removed"));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("seller.banner.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("seller.banner.subtitle")}</p>
      </div>

      {}
      {(subscriptionError || bannersQuery.isError) && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.banner.loadFailed")}
        </Card>
      )}

      {}
      {locked && !subscriptionError && <LockedCard />}

      {bannersQuery.isLoading ? (
        <Skeleton className="h-44 w-full rounded-2xl" />
      ) : (
        <>
          {}
          {banner && (
            <BannerCard banner={banner} locale={locale} onRemove={() => onRemove(banner.id)} />
          )}

          {!locked && !banner && (
            <Card className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <ImageIcon className="size-8 text-muted-foreground opacity-60" />
              <p className="font-medium">{t("seller.banner.empty")}</p>
              <p className="max-w-md text-sm text-muted-foreground">
                {t("seller.banner.emptyText")}
              </p>
            </Card>
          )}

          {!locked && (banner || canCreate) && (
            <BannerForm key={banner?.id ?? "new"} banner={banner} />
          )}
        </>
      )}
    </div>
  );
}

function LockedCard() {
  const { t } = useT();
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      <Lock className="size-8 text-muted-foreground opacity-60" />
      <p className="font-medium">{t("seller.banner.locked")}</p>
      <p className="max-w-md text-sm text-muted-foreground">{t("seller.banner.lockedText")}</p>
      <Button asChild className="mt-1">
        <Link href="/seller/subscription">{t("seller.banner.upgrade")}</Link>
      </Button>
    </Card>
  );
}

function BannerCard({
  banner,
  locale,
  onRemove,
}: {
  banner: Banner;
  locale: Locale;
  onRemove: () => Promise<void>;
}) {
  const { t } = useT();
  const src = bannerImageUrl(banner, locale);
  const statusText = STATUS_TEXT[banner.status] ?? STATUS_TEXT.pending;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start gap-5">
        <div
          style={{ aspectRatio: BANNER_ASPECT_CSS }}
          className="w-56 shrink-0 overflow-hidden rounded-lg border border-border bg-muted"
        >
          <img
            src={src ?? ""}
            alt={banner.title}
            className="size-full object-contain"
            onError={(e) => e.currentTarget.classList.add("opacity-0")}
          />
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{banner.title}</p>
            <BannerStatusBadge status={banner.status} />
          </div>

          <p className="text-sm text-muted-foreground">{t(statusText)}</p>

          {banner.status === "rejected" && banner.rejectReason && (
            <p className="text-sm text-destructive">
              {t("seller.banner.rejectReason", { reason: banner.rejectReason })}
            </p>
          )}

          {banner.linkUrl && (
            <a
              href={banner.linkUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              <ExternalLink className="size-3" />
              {banner.linkUrl}
            </a>
          )}
        </div>

        <ConfirmDialog
          title={t("seller.banner.removeTitle")}
          description={t("seller.banner.removeText")}
          confirmLabel={t("common.delete")}
          destructive
          onConfirm={onRemove}
        >
          <Button
            size="sm"
            variant="ghost"
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" />
            {t("seller.banner.remove")}
          </Button>
        </ConfirmDialog>
      </div>
    </Card>
  );
}
