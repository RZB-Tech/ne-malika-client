"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "@/components/icons";
import { TelegramIcon } from "@/components/icons/telegram-icon";
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
  useSellerShopsControllerUpdate,
} from "@/lib/api/generated/endpoints/shops-seller/shops-seller";
import { useSellerShop } from "@/lib/api/seller";
import { useAuth } from "@/lib/api/auth";
import { apiErrorMessage } from "@/lib/api/errors";
import { dataUrlToBlob, uploadPhoto } from "@/lib/api/upload";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { parseTelegramUsername, telegramUrl } from "@/lib/telegram";

export default function SellerProfile() {
  const { t } = useT();
  const queryClient = useQueryClient();
  const logoInput = useRef<HTMLInputElement>(null);

  const { shop, isLoading: shopLoading } = useSellerShop();
  const { refreshSession } = useAuth();

  const createMutation = useSellerShopsControllerCreate();
  const updateMutation = useSellerShopsControllerUpdate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [hours, setHours] = useState<WorkingHours>(defaultWorkingHours);
  const [logo, setLogo] = useState<string | null>(null);
  const [photoKey, setPhotoKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hydratedShopId, setHydratedShopId] = useState<number | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const telegramRef = useRef<HTMLInputElement>(null);

  if (shop && shop.id !== hydratedShopId) {
    setHydratedShopId(shop.id);
    setName(shop.name);
    setDescription(shop.description ?? "");
    setAddress(shop.address ?? "");
    setPhone(shop.contact ?? "");
    setTelegram(parseTelegramUsername(shop.telegramLink ?? "") ?? "");
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

    const tgUsername = telegram.trim() ? parseTelegramUsername(telegram) : null;

    const found: Record<string, string> = {};
    if (name.trim().length < 2) found.name = t("seller.profile.needName");
    if (!shop && !phone.trim()) found.phone = t("seller.profile.needPhone");
    if (telegram.trim() && !tgUsername) found.telegram = t("seller.profile.badTelegram");

    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = found.name ? nameRef : found.phone ? phoneRef : telegramRef;
      first.current?.focus();
      first.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }

    setSaving(true);
    try {
      let photo = photoKey ?? undefined;
      if (logo) {
        try {
          photo = await uploadPhoto(dataUrlToBlob(logo));
        } catch {
          toast.message(t("seller.profile.logoSkipped"));
        }
      }

      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        address: address.trim() || undefined,
        contact: phone.trim() || undefined,
        telegramLink: tgUsername ? telegramUrl(tgUsername) : undefined,
        workSchedule: toWorkSchedule(hours),
        photo,
      };

      if (shop) {
        await updateMutation.mutateAsync({ id: shop.id, data: payload });
      } else {
        await createMutation.mutateAsync({ data: payload });
        await refreshSession();
      }

      await queryClient.invalidateQueries();
      setPhotoKey(photo ?? null);
      setLogo(null);
      toast.success(t("seller.profile.saved"));
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "seller.profile.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const field = "space-y-1.5";
  const logoSrc = logo ?? photoUrl(photoKey);
  const hue = shop ? hueFromId(shop.id) : 262;

  if (shopLoading) {
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
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t(shop ? "seller.profile.title" : "seller.shop.createTitle")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t(shop ? "seller.profile.subtitle" : "seller.shop.createSubtitle")}
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
              {(name || t("seller.shop.mine")).slice(0, 1)}
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
            <Label htmlFor="sname">
              {t("seller.profile.storeName")} <Required />
            </Label>
            <Input
              id="sname"
              ref={nameRef}
              value={name}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "sname-err" : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: "" }));
              }}
            />
            <FieldError id="sname-err" message={errors.name} />
          </div>
          <div className={field}>
            <Label htmlFor="sdesc">{t("seller.profile.description")}</Label>
            <Textarea
              id="sdesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
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
                placeholder={t("seller.profile.addressPlaceholder")}
              />
            </div>
            <div className={field}>
              <Label htmlFor="sphone">
                {t("seller.profile.phone")} {!shop && <Required />}
              </Label>
              <Input
                id="sphone"
                ref={phoneRef}
                type="tel"
                value={phone}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "sphone-err" : undefined}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((p) => ({ ...p, phone: "" }));
                }}
                placeholder="+998 90 123 45 67"
              />
              <FieldError id="sphone-err" message={errors.phone} />
            </div>
            <div className={field}>
              <Label htmlFor="stg">{t("seller.profile.telegram")}</Label>
              <div className="relative">
                <TelegramIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="stg"
                  ref={telegramRef}
                  value={telegram}
                  aria-invalid={Boolean(errors.telegram)}
                  onChange={(e) => {
                    setTelegram(e.target.value);
                    if (errors.telegram) setErrors((p) => ({ ...p, telegram: "" }));
                  }}
                  onBlur={() => {
                    const u = parseTelegramUsername(telegram);
                    if (u) setTelegram(u);
                  }}
                  placeholder={t("seller.profile.telegramPlaceholder")}
                  className="pl-9"
                />
              </div>
              {telegram.trim() &&
                (parseTelegramUsername(telegram) ? (
                  <p className="text-xs text-muted-foreground">
                    {t("seller.profile.telegramHint", {
                      url: telegramUrl(parseTelegramUsername(telegram)!),
                    })}
                  </p>
                ) : (
                  <FieldError message={t("seller.profile.badTelegram")} />
                ))}
            </div>
            <div className={`${field} sm:col-span-2`}>
              <Label>{t("seller.profile.workingHours")}</Label>
              <WorkingHoursEditor value={hours} onChange={setHours} />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col items-end gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? t("common.loading") : shop ? t("common.save") : t("seller.shop.create")}
        </Button>
        {!shop && <p className="text-xs text-muted-foreground">{t("seller.shop.afterCreate")}</p>}
      </div>
    </form>
  );
}

function Required() {
  const { t } = useT();
  return (
    <span className="text-destructive" title={t("seller.profile.requiredMark")}>
      <span aria-hidden>*</span>
      <span className="sr-only">{t("seller.profile.requiredMark")}</span>
    </span>
  );
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  );
}
