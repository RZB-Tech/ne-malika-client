"use client";

import { BarChart3, Eye, Package, Send, Store, Target, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { ColumnChart, BarList } from "@/components/shared/charts";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/format";
import { publicProducts, stores, categories, categoryProductCount } from "@/lib/data";

function daySeries(seed: number, base: number) {
  return Array.from({ length: 30 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.6) * 0.22 + Math.sin(i * 0.25) * 0.12;
    const value = Math.round(base * (0.55 + i / 40) * (1 + wave));
    const label = i % 5 === 0 ? String(30 - i) : "";
    return { label, value };
  });
}

export default function AdminStats() {
  const { t, locale } = useT();

  const clicks = publicProducts.reduce((s, p) => s + p.telegramClicks, 0);
  const views = publicProducts.reduce((s, p) => s + p.views, 0);
  const storeViews = stores.reduce((s, x) => s + x.storeViews, 0);
  const avgCtr = views ? Math.round((clicks / views) * 1000) / 10 : 0;
  const activeSellers = stores.filter((s) => s.status === "active").length;

  const byCategory = categories
    .map((c) => ({ label: c.name[locale], value: categoryProductCount(c.slug), hue: 262 }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.stats.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("admin.stats.subtitle")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label={t("admin.stats.telegramClicks")} value={formatNumber(clicks, locale)} icon={Send} delta={18} hint="30 дн." />
        <StatCard label={t("admin.stats.productViews")} value={formatNumber(views, locale)} icon={Eye} delta={11} hint="30 дн." />
        <StatCard label={t("admin.stats.storeViews")} value={formatNumber(storeViews, locale)} icon={Store} delta={7} hint="30 дн." />
        <StatCard label={t("admin.stats.productsAdded")} value={formatNumber(publicProducts.length + 240, locale)} icon={Package} delta={5} hint="30 дн." />
        <StatCard label={t("admin.stats.activeSellers")} value={String(activeSellers + 44)} icon={Users} delta={12} hint="30 дн." />
        <StatCard label={t("admin.stats.avgCtr")} value={`${avgCtr}%`} icon={Target} delta={2} hint="> 20%" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="size-4 text-primary" />
            <h2 className="font-medium">{t("admin.stats.clicksDynamics")}</h2>
          </div>
          <ColumnChart data={daySeries(1, 420)} height={200} />
        </Card>

        <Card className="p-5">
          <h2 className="mb-5 font-medium">{t("admin.stats.byCategory")}</h2>
          <BarList data={byCategory} formatValue={(v) => String(v)} />
        </Card>
      </div>
    </div>
  );
}
