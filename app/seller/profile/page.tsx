"use client";

import { useRef, useState } from "react";
import { Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WorkingHoursEditor } from "@/components/seller/working-hours";
import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import { useT } from "@/components/providers/i18n-provider";
import { getStore, CURRENT_STORE_ID } from "@/lib/data";
import { BASE_CITY } from "@/lib/geo-suggest";

export default function SellerProfile() {
  const { t } = useT();
  const store = getStore(CURRENT_STORE_ID)!;
  const [address, setAddress] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const logoInput = useRef<HTMLInputElement>(null);

  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("seller.profile.logoInvalid"));
      return;
    }
    const fr = new FileReader();
    fr.onload = () => setLogo(fr.result as string);
    fr.readAsDataURL(file);
  };

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
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={store.name}
              className="size-20 shrink-0 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <span
              className="grid size-20 shrink-0 place-items-center rounded-2xl text-3xl font-bold text-white shadow-sm"
              style={{ background: `oklch(0.52 0.17 ${store.logoHue})` }}
            >
              {store.name.slice(0, 1)}
            </span>
          )}
          <div>
            <Label className="mb-1.5 block">{t("seller.profile.logo")}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => logoInput.current?.click()}
            >
              <Upload className="size-4" />
              {logo ? t("seller.profile.changeLogo") : t("seller.profile.uploadLogo")}
            </Button>
            <input
              ref={logoInput}
              type="file"
              accept="image/*"
              hidden
              onChange={pickLogo}
            />
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
              <Label htmlFor="scity">{t("seller.profile.city")}</Label>
              <Input id="scity" value={BASE_CITY} readOnly disabled />
            </div>
            <div className={field}>
              <Label htmlFor="saddr">{t("seller.profile.address")}</Label>
              <AddressAutocomplete
                id="saddr"
                kind="address"
                city={BASE_CITY}
                value={address}
                onChange={setAddress}
                placeholder="ул. Амира Темура, 15"
              />
            </div>
            <div className={field}>
              <Label htmlFor="sphone">{t("seller.profile.phone")}</Label>
              <Input id="sphone" type="tel" placeholder="+998 90 123 45 67" />
            </div>
            <div className={field}>
              <Label htmlFor="stg">{t("seller.profile.telegram")}</Label>
              <div className="relative">
                <Send className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="stg" placeholder="username" className="pl-9" />
              </div>
            </div>
            <div className={`${field} sm:col-span-2`}>
              <Label>{t("seller.profile.workingHours")}</Label>
              <WorkingHoursEditor />
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
