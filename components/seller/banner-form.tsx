"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ImagePlus, TriangleAlert } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/providers/i18n-provider";
import { localeNames } from "@/lib/i18n/config";
import {
  BANNER_ASPECT_CSS,
  BANNER_FORMATS_LABEL,
  BANNER_LOCALES,
  BANNER_MIME_TYPES,
  bannerPhotoKey,
  checkBannerImage,
  type Banner,
  type BannerLocale,
} from "@/lib/api/banners";
import { BannerAiPanel } from "./banner-ai-panel";
import { apiErrorMessage } from "@/lib/api/errors";
import { photoUrl } from "@/lib/api/photo";
import { uploadPhoto } from "@/lib/api/upload";
import { cn } from "@/lib/utils";
import {
  getSellerBannersControllerListQueryKey,
  useSellerBannersControllerCreate,
  useSellerBannersControllerUpdate,
} from "@/lib/api/generated/endpoints/banners-seller/banners-seller";

interface Slot {
  key?: string;
  file?: File;
  preview: string;
}

type Slots = Record<BannerLocale, Slot | null>;

const EMPTY_SLOTS: Slots = { ru: null, "uz-Latn": null };

export function BannerForm({ banner }: { banner: Banner | null }) {
  const { t } = useT();
  const queryClient = useQueryClient();

  const createMutation = useSellerBannersControllerCreate();
  const updateMutation = useSellerBannersControllerUpdate();

  const [title, setTitle] = useState(banner?.title ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [slots, setSlots] = useState<Slots>(() => (banner ? storedSlots(banner) : EMPTY_SLOTS));
  const [saving, setSaving] = useState(false);

  const objectUrls = useRef<string[]>([]);
  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const pick = async (locale: BannerLocale, file: File) => {
    const problem = await checkBannerImage(file);
    if (problem) {
      toast.error(t(`seller.banner.err.${problem}`, { sizes: BANNER_FORMATS_LABEL }));
      return;
    }
    const preview = URL.createObjectURL(file);
    objectUrls.current.push(preview);
    setSlots((s) => ({ ...s, [locale]: { file, preview } }));
  };

  const copyToAll = (from: BannerLocale) => {
    setSlots((s) => {
      const source = s[from];
      if (!source) return s;
      return { ru: source, "uz-Latn": source };
    });
    toast.success(t("seller.banner.copiedToAll"));
  };

  /** Нарисованное моделью уже лежит в хранилище — в слот кладём готовый ключ. */
  const applyGenerated = (locale: BannerLocale, key: string) => {
    setSlots((s) => ({ ...s, [locale]: { key, preview: photoUrl(key) ?? "" } }));
  };

  const dirty = !banner || changedFrom(banner, title, linkUrl, slots);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 2) {
      toast.error(t("seller.banner.needTitle"));
      return;
    }
    if (BANNER_LOCALES.some((l) => !slots[l])) {
      toast.error(t("seller.banner.needImages"));
      return;
    }

    setSaving(true);
    try {
      const keys = await resolveSlotKeys(slots);

      const data = {
        title: title.trim(),
        photoRu: keys.ru,
        photoUzLatn: keys["uz-Latn"],
        linkUrl: linkUrl.trim(),
      };

      if (banner) {
        await updateMutation.mutateAsync({ id: banner.id, data });
      } else {
        await createMutation.mutateAsync({ data });
      }

      setSlots((s) => ({
        ru: { key: keys.ru, preview: s.ru?.preview ?? "" },
        "uz-Latn": { key: keys["uz-Latn"], preview: s["uz-Latn"]?.preview ?? "" },
      }));

      await queryClient.invalidateQueries({
        queryKey: getSellerBannersControllerListQueryKey(),
      });
      toast.success(t("seller.banner.saved"));
    } catch (err) {
      toast.error(apiErrorMessage(err, t, "seller.banner.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="flex flex-col gap-5">
        {!banner && (
          <h2 className="font-heading text-lg font-bold tracking-tight">
            {t("seller.banner.upload")}
          </h2>
        )}

        {banner && <ModerationWarning approved={banner.status === "approved"} />}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seller-banner-title">{t("seller.banner.name")}</Label>
          <Input
            id="seller-banner-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("seller.banner.namePlaceholder")}
          />
          <p className="text-xs text-muted-foreground">{t("seller.banner.nameHint")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("seller.banner.images")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("seller.banner.hint", { sizes: BANNER_FORMATS_LABEL })}
            </p>
          </div>
          <BannerAiPanel
            currentRuKey={slots.ru?.key}
            onGenerated={applyGenerated}
            disabled={saving}
          />

          {BANNER_LOCALES.map((locale) => (
            <SlotPicker
              key={locale}
              label={localeNames[locale]}
              slot={slots[locale]}
              onPick={(file) => pick(locale, file)}
              onCopyToAll={() => copyToAll(locale)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="seller-banner-link">{t("seller.banner.link")}</Label>
          <Input
            id="seller-banner-link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/product/12"
          />
          <p className="text-xs text-muted-foreground">{t("seller.banner.linkHint")}</p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving || !dirty}>
            {saving ? t("common.saving") : t("seller.banner.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ModerationWarning({ approved }: { approved: boolean }) {
  const { t } = useT();
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-lg border p-3 text-xs",
        approved
          ? "border-warning/40 bg-warning/5 text-warning"
          : "border-border text-muted-foreground",
      )}
    >
      <TriangleAlert className="mt-px size-3.5 shrink-0" />
      {t("seller.banner.moderationHint")}
    </p>
  );
}

function SlotPicker({
  label,
  slot,
  onPick,
  onCopyToAll,
}: {
  label: string;
  slot: Slot | null;
  onPick: (file: File) => void;
  onCopyToAll: () => void;
}) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ aspectRatio: BANNER_ASPECT_CSS }}
        className="relative w-40 shrink-0 overflow-hidden rounded border border-border bg-muted transition-colors hover:border-primary/50"
      >
        {slot ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={slot.preview} alt="" className="size-full object-contain" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <ImagePlus className="size-5" />
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {slot ? t("seller.banner.picked") : t("seller.banner.notPicked")}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        {slot && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCopyToAll}
            title={t("seller.banner.copyToAll")}
            aria-label={t("seller.banner.copyToAll")}
          >
            <Copy className="size-4" />
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
          {t(slot ? "seller.banner.replace" : "seller.banner.pick")}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={BANNER_MIME_TYPES.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
    </div>
  );
}

function changedFrom(banner: Banner, title: string, linkUrl: string, slots: Slots): boolean {
  return (
    title.trim() !== banner.title ||
    linkUrl.trim() !== (banner.linkUrl ?? "") ||
    BANNER_LOCALES.some((l) => slots[l]?.key !== bannerPhotoKey(banner, l))
  );
}

function storedSlots(banner: Banner): Slots {
  const slot = (locale: BannerLocale): Slot => {
    const key = bannerPhotoKey(banner, locale);
    return { key, preview: photoUrl(key) ?? "" };
  };
  return { ru: slot("ru"), "uz-Latn": slot("uz-Latn") };
}

async function resolveSlotKeys(slots: Slots): Promise<Record<BannerLocale, string>> {
  const started = new Map<Slot, Promise<string>>();

  const keyOf = (slot: Slot): Promise<string> => {
    if (slot.key) return Promise.resolve(slot.key);
    let pending = started.get(slot);
    if (!pending) {
      pending = uploadPhoto(slot.file!);
      started.set(slot, pending);
    }
    return pending;
  };

  const [ru, uzLatn] = await Promise.all([keyOf(slots.ru!), keyOf(slots["uz-Latn"]!)]);

  return { ru, "uz-Latn": uzLatn };
}
