"use client";

import Link from "next/link";
import { Clock, MapPin, Package, Star, Store as StoreIcon } from "@/components/icons";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber, formatRating } from "@/lib/format";
import { hueFromId, formatWorkSchedule } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import type { PublicShopListItemDto } from "@/lib/api/generated/schemas";
import type { WorkScheduleEntry } from "@/lib/api/types";

export function StoreCard({ shop }: { shop: PublicShopListItemDto }) {
  const { t, locale } = useT();

  const hours = formatWorkSchedule(
    (shop.workSchedule as WorkScheduleEntry[] | null) ?? undefined,
    t,
  );

  return (
    <Link
      href={`/store/${shop.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <StoreAvatar
          name={shop.name}
          hue={hueFromId(shop.id)}
          src={photoUrl(shop.photo)}
          className="size-12 rounded-xl"
          fallback={<StoreIcon className="size-5" />}
        />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-medium text-foreground group-hover:text-primary">
            {shop.name}
          </h2>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {shop.ratingCount > 0 ? (
              <>
                <Star className="size-3.5 text-primary" />
                <span className="font-medium tabular">{formatRating(shop.ratingAvg)}</span>
                <span className="text-muted-foreground">
                  {t("reviews.count", { count: shop.ratingCount })}
                </span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("stores.noRating")}</span>
            )}
          </div>
        </div>
      </div>

      <dl className="space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Package className="size-3.5 shrink-0" />
          <dd>{t("stores.productCount", { count: formatNumber(shop.productCount, locale) })}</dd>
        </div>
        {shop.address && (
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 size-3.5 shrink-0" />
            <dd className="line-clamp-2">{shop.address}</dd>
          </div>
        )}
        {hours && (
          <div className="flex items-center gap-2">
            <Clock className="size-3.5 shrink-0" />
            <dd className="truncate">{hours}</dd>
          </div>
        )}
      </dl>
    </Link>
  );
}
