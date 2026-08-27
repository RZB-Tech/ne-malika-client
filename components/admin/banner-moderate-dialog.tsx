"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ExternalLink } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BannerStatusBadge } from "@/components/shared/badges";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import { localeShort, locales } from "@/lib/i18n/config";
import { BANNER_ASPECT_CSS, bannerImageUrl, type AdminBanner } from "@/lib/api/banners";
import {
  getAdminShopBannersControllerListQueryKey,
  useAdminShopBannersControllerModerate,
} from "@/lib/api/generated/endpoints/banners-admin/banners-admin";
import type { ModerateBannerDtoStatus } from "@/lib/api/generated/schemas";

const MIN_REASON = 5;

export interface BannerModerationTarget {
  banner: AdminBanner;
  decision: ModerateBannerDtoStatus;
}

export function BannerModerateDialog({
  target,
  onClose,
}: {
  target: BannerModerationTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {target && (
          <ModerateBody
            key={`${target.banner.id}:${target.decision}`}
            banner={target.banner}
            decision={target.decision}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModerateBody({
  banner,
  decision,
  onDone,
}: {
  banner: AdminBanner;
  decision: ModerateBannerDtoStatus;
  onDone: () => void;
}) {
  const { t, locale } = useT();
  const run = useAdminMutation();
  const moderate = useAdminShopBannersControllerModerate();

  const [reason, setReason] = useState("");

  const rejecting = decision === "rejected";
  const trimmed = reason.trim();

  const submit = async () => {
    if (rejecting && trimmed.length < MIN_REASON) {
      toast.error(t("admin.shopBanners.needReason"));
      return;
    }

    const ok = await run(
      () =>
        moderate.mutateAsync({
          id: banner.id,
          data: rejecting ? { status: "rejected", reason: trimmed } : { status: "approved" },
        }),
      {
        invalidate: [getAdminShopBannersControllerListQueryKey()],
        successKey: rejecting ? "admin.shopBanners.rejected" : "admin.shopBanners.approved",
        errorKey: "admin.shopBanners.actionFailed",
      },
    );
    if (ok) onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t(rejecting ? "admin.shopBanners.rejectTitle" : "admin.shopBanners.approveTitle")}
        </DialogTitle>
        <DialogDescription>
          {rejecting
            ? t("admin.shopBanners.rejectText")
            : t("admin.shopBanners.approveText", { name: banner.title })}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <BannerStatusBadge status={banner.status} />
        {banner.shopId !== null ? (
          <Link href={`/store/${banner.shopId}`} className="font-medium hover:underline">
            {banner.shopName}
          </Link>
        ) : (
          <span className="font-medium">{banner.shopName}</span>
        )}
        {banner.createdAt && (
          <span className="tabular text-xs text-muted-foreground">
            {t("admin.shopBanners.colCreated")}: {formatDate(banner.createdAt, locale)}
          </span>
        )}
      </div>

      {}
      <div className="grid gap-3 sm:grid-cols-3">
        {locales.map((loc) => {
          const src = bannerImageUrl(banner, loc);
          return (
            <div key={loc} className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">{localeShort[loc]}</p>
              <div
                style={{ aspectRatio: BANNER_ASPECT_CSS }}
                className="overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img
                  src={src ?? ""}
                  alt={`${banner.title} · ${localeShort[loc]}`}
                  className="size-full object-contain"
                  onError={(e) => e.currentTarget.classList.add("opacity-0")}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1 text-sm">
        <p className="font-medium">{banner.title}</p>
        {banner.linkUrl ? (
          <a
            href={banner.linkUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            <ExternalLink className="size-3" />
            {t("admin.shopBanners.link", { url: banner.linkUrl })}
          </a>
        ) : (
          <p className="text-xs text-muted-foreground">{t("admin.shopBanners.noLink")}</p>
        )}
        {banner.rejectReason && (
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

      {rejecting && (
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          maxLength={1000}
          placeholder={t("admin.common.reasonPlaceholder")}
        />
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={moderate.isPending}>
          {t("common.cancel")}
        </Button>
        <Button
          variant={rejecting ? "destructive" : "default"}
          onClick={submit}
          disabled={moderate.isPending || (rejecting && trimmed.length < MIN_REASON)}
        >
          {moderate.isPending
            ? t("common.running")
            : t(rejecting ? "admin.shopBanners.reject" : "admin.shopBanners.approve")}
        </Button>
      </DialogFooter>
    </>
  );
}
