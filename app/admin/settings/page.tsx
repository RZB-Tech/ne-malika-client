"use client";

import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/components/providers/i18n-provider";

export default function AdminSettings() {
  const { t } = useT();

  const toggles = [
    { id: "premoderation", label: { ru: "Премодерация товаров", en: "Pre-moderate products" }, on: true },
    { id: "sellerapprove", label: { ru: "Ручное одобрение продавцов", en: "Manual seller approval" }, on: true },
    { id: "telegram", label: { ru: "Вход через Telegram", en: "Telegram login" }, on: true },
  ];
  const { locale } = useT();

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("common.save"));
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("admin.nav.settings")}</h1>
      </div>

      <Card className="p-6">
        <div className="grid gap-5 sm:max-w-md">
          <div className="space-y-1.5">
            <Label htmlFor="pname">{t("brand.name")}</Label>
            <Input id="pname" defaultValue="Ядро" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue="support@yadro.market" />
          </div>
        </div>
      </Card>

      <Card className="divide-y divide-border p-0">
        {toggles.map((tg) => (
          <div key={tg.id} className="flex items-center justify-between px-6 py-4">
            <Label htmlFor={tg.id} className="cursor-pointer font-normal">{tg.label[locale]}</Label>
            <Switch id={tg.id} defaultChecked={tg.on} />
          </div>
        ))}
      </Card>

      <div className="flex justify-end">
        <Button type="submit">{t("common.save")}</Button>
      </div>
    </form>
  );
}
