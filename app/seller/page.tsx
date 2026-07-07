"use client";

import Link from "next/link";
import { Eye, MousePointerClick, Package, Send, Store, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import { AreaChart, BarList } from "@/components/shared/charts";
import { ProductImage } from "@/components/shared/product-image";
import { ModerationBadge } from "@/components/shared/badges";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber, formatPrice } from "@/lib/format";
import { products, getStore, CURRENT_STORE_ID } from "@/lib/data";

// Deterministic pseudo-random 30-day series that trends upward.
function series(seed: number, base: number): number[] {
  return Array.from({ length: 30 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.7) * 0.25 + Math.sin(i * 0.3) * 0.15;
    return Math.round(base * (0.6 + i / 45) * (1 + wave));
  });
}

export default function SellerDashboard() {
  const { t, locale } = useT();
  const store = getStore(CURRENT_STORE_ID)!;
  const mine = products.filter((p) => p.storeId === CURRENT_STORE_ID);

  const views = mine.reduce((s, p) => s + p.views, 0);
  const clicks = mine.reduce((s, p) => s + p.telegramClicks, 0);
  const ctr = views ? Math.round((clicks / views) * 1000) / 10 : 0;
  const active = mine.filter((p) => p.moderation === "published" && !p.hidden).length;
  const moderation = mine.filter((p) => p.moderation === "moderation").length;

  const clicksSeries = series(2, 32);

  const top = [...mine]
    .filter((p) => p.telegramClicks > 0)
    .sort((a, b) => b.telegramClicks - a.telegramClicks)
    .slice(0, 5);

  const recent = [...mine]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("seller.dashboard.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("seller.dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("seller.dashboard.telegramClicks")} value={formatNumber(clicks, locale)} icon={Send} delta={14} hint="30 дн." />
        <StatCard label={t("seller.dashboard.productViews")} value={formatNumber(views, locale)} icon={Eye} delta={9} hint="30 дн." />
        <StatCard label={t("seller.dashboard.ctr")} value={`${ctr}%`} icon={Target} delta={3} hint="vs 20%" />
        <StatCard label={t("seller.dashboard.storeViews")} value={formatNumber(store.storeViews, locale)} icon={Store} delta={6} hint="30 дн." />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-medium">{t("seller.dashboard.telegramClicks")}</h2>
            <Badge variant="secondary" className="gap-1 tabular">
              <MousePointerClick className="size-3" /> {formatNumber(clicks, locale)}
            </Badge>
          </div>
          <AreaChart data={clicksSeries} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 font-medium">{t("seller.dashboard.topProducts")}</h2>
          {top.length ? (
            <BarList
              data={top.map((p) => ({ label: p.model, value: p.telegramClicks, hue: p.hue }))}
              formatValue={(v) => formatNumber(v, locale)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t("seller.dashboard.activeProducts")} value={String(active)} icon={Package} hint={t("seller.products.visible")} />
        <StatCard label={t("seller.dashboard.onModeration")} value={String(moderation)} icon={Package} hint={t("moderation.moderation")} />
        <StatCard label={t("store.rating")} value={store.rating.toFixed(1)} icon={Target} hint={`${store.ratingCount}`} />
      </div>

      <Card className="p-0">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-medium">{t("seller.dashboard.recentProducts")}</h2>
          <Link href="/seller/products" className="text-sm font-medium text-primary hover:underline">
            {t("home.viewAll")}
          </Link>
        </div>
        <ul className="divide-y divide-border">
          {recent.map((p) => (
            <li key={p.id} className="flex items-center gap-4 px-5 py-3">
              <ProductImage hue={p.hue} categorySlug={p.categorySlug} className="size-11 rounded-lg" iconClassName="size-5" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground tabular">
                  {formatPrice(p.price, locale)} {t("common.currency")}
                </div>
              </div>
              <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                <Eye className="size-3.5" /> <span className="tabular">{formatNumber(p.views, locale)}</span>
              </div>
              <ModerationBadge status={p.moderation} />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
