"use client";

import { useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/providers/i18n-provider";

interface Banner {
  id: string;
  title: Record<string, string>;
  placement: string;
  hue: number;
  active: boolean;
}

const initialBanners: Banner[] = [
  { id: "b1", title: { ru: "Скидки на видеокарты", en: "Deals on graphics cards" }, placement: "home / hero", hue: 262, active: true },
  { id: "b2", title: { ru: "Готовые игровые ПК", en: "Prebuilt gaming PCs" }, placement: "home / promo", hue: 150, active: true },
  { id: "b3", title: { ru: "Продавайте на Ядро", en: "Sell on Yadro" }, placement: "home / promo", hue: 25, active: true },
  { id: "b4", title: { ru: "Чёрная пятница", en: "Black Friday" }, placement: "home / hero", hue: 320, active: false },
];

export default function AdminBanners() {
  const { t, locale } = useT();
  const [banners, setBanners] = useState(initialBanners);

  const toggle = (id: string) =>
    setBanners((b) => b.map((x) => (x.id === id ? { ...x, active: !x.active } : x)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.nav.banners")}</h1>
          <p className="mt-1 text-sm text-muted-foreground tabular">{banners.length}</p>
        </div>
        <Button className="gap-2">
          <Plus className="size-4" />
          {t("common.add")}
        </Button>
      </div>

      <div className="space-y-3">
        {banners.map((b) => (
          <Card key={b.id} className="flex flex-row items-center gap-4 p-3">
            <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
            <div
              className="hidden h-14 w-28 shrink-0 rounded-lg sm:block"
              style={{ backgroundImage: `linear-gradient(120deg, oklch(0.62 0.16 ${b.hue}), oklch(0.44 0.15 ${b.hue}))` }}
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-medium">{b.title[locale]}</h3>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant="secondary" className="font-mono text-xs">{b.placement}</Badge>
                <span className="text-xs text-muted-foreground">{b.active ? t("seller.products.visible") : t("seller.products.hidden")}</span>
              </div>
            </div>
            <Switch checked={b.active} onCheckedChange={() => toggle(b.id)} />
          </Card>
        ))}
      </div>
    </div>
  );
}
