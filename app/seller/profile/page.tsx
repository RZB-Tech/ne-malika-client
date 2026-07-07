"use client";

import { useState } from "react";
import { Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/providers/i18n-provider";
import { getStore, cities, CURRENT_STORE_ID } from "@/lib/data";

export default function SellerProfile() {
  const { t } = useT();
  const store = getStore(CURRENT_STORE_ID)!;
  const [city, setCity] = useState(store.city);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t("seller.profile.saved"));
  };

  const field = "space-y-1.5";

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("seller.profile.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("seller.profile.subtitle")}</p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <span
            className="grid size-20 shrink-0 place-items-center rounded-2xl text-3xl font-bold text-white shadow-sm"
            style={{ background: `oklch(0.52 0.17 ${store.logoHue})` }}
          >
            {store.name.slice(0, 1)}
          </span>
          <div>
            <Label className="mb-1.5 block">{t("seller.profile.logo")}</Label>
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Upload className="size-4" />
              {t("seller.profile.uploadLogo")}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">PNG, JPG · 512×512</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-5">
          <div className={field}>
            <Label htmlFor="sname">{t("seller.profile.storeName")}</Label>
            <Input id="sname" defaultValue={store.name} />
          </div>
          <div className={field}>
            <Label htmlFor="sdesc">{t("seller.profile.description")}</Label>
            <Textarea id="sdesc" rows={3} defaultValue={store.description} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className={field}>
              <Label>{t("seller.profile.city")}</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className={field}>
              <Label htmlFor="saddr">{t("seller.profile.address")}</Label>
              <Input id="saddr" defaultValue={store.address} />
            </div>
            <div className={field}>
              <Label htmlFor="sphone">{t("seller.profile.phone")}</Label>
              <Input id="sphone" defaultValue={store.phone} />
            </div>
            <div className={field}>
              <Label htmlFor="stg">{t("seller.profile.telegram")}</Label>
              <div className="relative">
                <Send className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="stg" defaultValue={store.telegram} className="pl-9" />
              </div>
            </div>
            <div className={`${field} sm:col-span-2`}>
              <Label htmlFor="shours">{t("seller.profile.workingHours")}</Label>
              <Input id="shours" defaultValue={store.workingHours} />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">{t("common.save")}</Button>
      </div>
    </form>
  );
}
