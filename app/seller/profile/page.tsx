"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WorkingHoursEditor,
  defaultWorkingHours,
  fromWorkSchedule,
  toWorkSchedule,
  type WorkingHours,
} from "@/components/seller/working-hours";
import { AddressAutocomplete } from "@/components/shared/address-autocomplete";
import { useT } from "@/components/providers/i18n-provider";
import { BASE_CITY } from "@/lib/geo-suggest";
import {
  useSellerShopsControllerCreate,
  useSellerShopsControllerList,
  useSellerShopsControllerUpdate,
} from "@/lib/api/generated/endpoints/shops-seller/shops-seller";
import { dataUrlToBlob, uploadPhoto } from "@/lib/api/upload";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import type { ShopRow } from "@/lib/api/types";

export default function SellerProfile() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const logoInput = useRef<HTMLInputElement>(null);

  const shopsQuery = useSellerShopsControllerList({
    query: { select: (raw) => raw as unknown as ShopRow[] },
  });
  const shop = shopsQuery.data?.[0];

  const createMutation = useSellerShopsControllerCreate();
  const updateMutation = useSellerShopsControllerUpdate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [hours, setHours] = useState<WorkingHours>(defaultWorkingHours);
  const [logo, setLogo] = useState<string | null>(null); // data URL for new upload
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydratedShopId, setHydratedShopId] = useState<number | null>(null);

  // Populate the form once, when the shop loads. Приводим состояние прямо во
  // время рендера (рекомендованная React альтернатива setState в эффекте):
  // повторный рендер происходит до отрисовки, без лишнего кадра.
  if (shop && shop.id !== hydratedShopId) {
    setHydratedShopId(shop.id);
    setName(shop.name);
    setDescription(shop.description ?? "");
    setAddress(shop.address ?? "");
    setPhone(shop.contact ?? "");
    setTelegram(
      (shop.telegramLink ?? "").replace(/^https?:\/\/t\.me\//, "").replace(/^@/, ""),
    );
    setHours(fromWorkSchedule(shop.workSchedule));
    setPhotoKey(shop.photo ?? null);
  }

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

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2) {
      toast.error("Укажите название магазина");
      return;
    }
    if (!shop && !phone.trim()) {
      toast.error("Укажите контактный телефон");
      return;
    }

    setSaving(true);
    try {
      let photo = photoKey ?? undefined;
      if (logo) {
        try {
          photo = await uploadPhoto(dataUrlToBlob(logo));
        } catch {
          toast.message("Логотип не загрузился — сохраняем без него");
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        contact: phone.trim() || undefined,
        telegramLink: telegram.trim()
          ? `https://t.me/${telegram.trim().replace(/^@/, "")}`
          : undefined,
        workSchedule: toWorkSchedule(hours),
        photo,
      };

      if (shop) {
        await updateMutation.mutateAsync({ id: shop.id, data: payload });
      } else {
        await createMutation.mutateAsync({ data: payload });
      }

      await queryClient.invalidateQueries();
      // The form hydrates from `shop` only once, so the freshly stored key has
      // to be pushed into state here — otherwise dropping the data-URL preview
      // below falls back to the previous photo.
      setPhotoKey(photo ?? null);
      setLogo(null);
      toast.success(t("seller.profile.saved"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не удалось сохранить магазин");
    } finally {
      setSaving(false);
    }
  };

  const field = "space-y-1.5";
  const logoSrc = logo ?? photoUrl(photoKey);
  const hue = shop ? hueFromId(shop.id) : 262;

  if (shopsQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{t("seller.profile.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shop ? t("seller.profile.subtitle") : "Создайте магазин, чтобы публиковать товары"}
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt={name}
              className="size-20 shrink-0 rounded-2xl object-cover shadow-sm"
            />
          ) : (
            <span
              className="grid size-20 shrink-0 place-items-center rounded-2xl text-3xl font-bold text-white shadow-sm"
              style={{ background: `oklch(0.52 0.17 ${hue})` }}
            >
              {(name || "М").slice(0, 1)}
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
              {logoSrc ? t("seller.profile.changeLogo") : t("seller.profile.uploadLogo")}
            </Button>
            <input ref={logoInput} type="file" accept="image/*" hidden onChange={pickLogo} />
            <p className="mt-2 text-xs text-muted-foreground">PNG, JPG · 512×512</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="grid gap-5">
          <div className={field}>
            <Label htmlFor="sname">{t("seller.profile.storeName")}</Label>
            <Input id="sname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className={field}>
            <Label htmlFor="sdesc">{t("seller.profile.description")}</Label>
            <Textarea id="sdesc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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
              <Input
                id="sphone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
              />
            </div>
            <div className={field}>
              <Label htmlFor="stg">{t("seller.profile.telegram")}</Label>
              <div className="relative">
                <Send className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="stg"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="username"
                  className="pl-9"
                />
              </div>
            </div>
            <div className={`${field} sm:col-span-2`}>
              <Label>{t("seller.profile.workingHours")}</Label>
              <WorkingHoursEditor value={hours} onChange={setHours} />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? t("common.loading") : t("common.save")}
        </Button>
      </div>
    </form>
  );
}
