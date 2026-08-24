"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, ImagePlus } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/components/providers/i18n-provider";
import { localeNames, locales, type Locale } from "@/lib/i18n/config";
import {
  BANNER_ASPECT_CSS,
  BANNER_FORMATS_LABEL,
  BANNER_MIME_TYPES,
  bannerPhotoKey,
  checkBannerImage,
  type Banner,
} from "@/lib/api/banners";
import { apiErrorMessage } from "@/lib/api/errors";
import { photoUrl } from "@/lib/api/photo";
import { uploadPhoto } from "@/lib/api/upload";
import {
  getAdminBannersControllerFindAllQueryKey,
  useAdminBannersControllerCreate,
  useAdminBannersControllerUpdate,
} from "@/lib/api/generated/endpoints/banners-admin/banners-admin";

/**
 * Картинка одного языка: либо уже сохранённая (есть `key`), либо только что
 * выбранная (есть `file`). Загрузка в S3 откладывается до сохранения формы —
 * иначе закрытый без сохранения диалог оставлял бы в бакете мусор.
 */
interface Slot {
  key?: string;
  file?: File;
  preview: string;
}

type Slots = Record<Locale, Slot | null>;

const EMPTY_SLOTS: Slots = { ru: null, "uz-Latn": null, "uz-Cyrl": null };

/** Создание и правка баннера. Одна форма на оба случая: поля совпадают. */
export function BannerFormDialog({
  target,
  onOpenChange,
}: {
  /** Баннер для правки, `null` — создание нового, `undefined` — диалог закрыт. */
  target: Banner | null | undefined;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={target !== undefined} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {target !== undefined && (
          <FormBody
            key={target?.id ?? "new"}
            banner={target}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function FormBody({
  banner,
  onDone,
}: {
  banner: Banner | null;
  onDone: () => void;
}) {
  const { t } = useT();
  const queryClient = useQueryClient();

  const createMutation = useAdminBannersControllerCreate();
  const updateMutation = useAdminBannersControllerUpdate();

  const [title, setTitle] = useState(banner?.title ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [slots, setSlots] = useState<Slots>(() =>
    banner ? storedSlots(banner) : EMPTY_SLOTS,
  );
  const [saving, setSaving] = useState(false);

  /**
   * Blob-ссылки предпросмотра живут, пока их не отозвать: без этого каждая
   * переоткрытая форма оставляет в памяти вкладки по мегабайту на картинку.
   */
  const objectUrls = useRef<string[]>([]);
  useEffect(
    () => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)),
    [],
  );

  const pick = async (locale: Locale, file: File) => {
    const problem = await checkBannerImage(file);
    if (problem) {
      toast.error(
        t(`admin.banners.err.${problem}`, { sizes: BANNER_FORMATS_LABEL }),
      );
      return;
    }
    const preview = URL.createObjectURL(file);
    objectUrls.current.push(preview);
    setSlots((s) => ({ ...s, [locale]: { file, preview } }));
  };

  /** Одна картинка на все языки — обычный случай, когда текста на ней нет. */
  const copyToAll = (from: Locale) => {
    setSlots((s) => {
      const source = s[from];
      if (!source) return s;
      return { ru: source, "uz-Latn": source, "uz-Cyrl": source };
    });
    toast.success(t("admin.banners.copiedToAll"));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 2) {
      toast.error(t("admin.banners.needTitle"));
      return;
    }
    if (locales.some((l) => !slots[l])) {
      toast.error(t("admin.banners.needImages"));
      return;
    }

    setSaving(true);
    try {
      const [photoRu, photoUzLatn, photoUzCyrl] = await Promise.all([
        resolveKey(slots.ru!),
        resolveKey(slots["uz-Latn"]!),
        resolveKey(slots["uz-Cyrl"]!),
      ]);

      const data = {
        title: title.trim(),
        photoRu,
        photoUzLatn,
        photoUzCyrl,
        /**
         * Пустую строку шлём как есть, а не `undefined`: ключа не было бы в
         * теле запроса вовсе, и очистка поля молча оставляла бы старую ссылку.
         */
        linkUrl: linkUrl.trim(),
        isActive,
      };

      if (banner) {
        await updateMutation.mutateAsync({ id: banner.id, data });
      } else {
        await createMutation.mutateAsync({ data });
      }

      await queryClient.invalidateQueries({
        queryKey: getAdminBannersControllerFindAllQueryKey(),
      });
      toast.success(
        t(banner ? "admin.banners.updated" : "admin.banners.created"),
      );
      onDone();
    } catch (err) {
      toast.error(
        apiErrorMessage(err, t, "admin.banners.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>
          {t(banner ? "admin.banners.editTitle" : "admin.banners.newTitle")}
        </DialogTitle>
        <DialogDescription>
          {t("admin.banners.formHint", { sizes: BANNER_FORMATS_LABEL })}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="banner-title">{t("admin.banners.name")}</Label>
        <Input
          id="banner-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("admin.banners.namePlaceholder")}
        />
        <p className="text-xs text-muted-foreground">
          {t("admin.banners.nameHint")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <Label>{t("admin.banners.images")}</Label>
        {locales.map((locale) => (
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
        <Label htmlFor="banner-link">{t("admin.banners.link")}</Label>
        <Input
          id="banner-link"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          placeholder="/product/12"
        />
        <p className="text-xs text-muted-foreground">
          {t("admin.banners.linkHint")}
        </p>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-border p-3">
        <span className="text-sm">
          {t("admin.banners.active")}
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t("admin.banners.activeHint")}
          </span>
        </span>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? t("common.saving") : t("common.save")}
        </Button>
      </DialogFooter>
    </form>
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
    <div className="flex items-center gap-3 rounded-lg border border-border p-3">
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
          {slot ? t("admin.banners.picked") : t("admin.banners.notPicked")}
        </p>
      </div>

      <div className="flex shrink-0 gap-1">
        {slot && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onCopyToAll}
            title={t("admin.banners.copyToAll")}
            aria-label={t("admin.banners.copyToAll")}
          >
            <Copy className="size-4" />
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          {t(slot ? "admin.banners.replace" : "admin.banners.pick")}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        hidden
        accept={BANNER_MIME_TYPES.join(",")}
        onChange={(e) => {
          const file = e.target.files?.[0];
          /* Сбрасываем значение: иначе повторный выбор того же файла молчит. */
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
    </div>
  );
}

/** Уже сохранённые картинки баннера — как заполненные слоты формы. */
function storedSlots(banner: Banner): Slots {
  const slot = (locale: Locale): Slot => {
    const key = bannerPhotoKey(banner, locale);
    return { key, preview: photoUrl(key) ?? "" };
  };
  return { ru: slot("ru"), "uz-Latn": slot("uz-Latn"), "uz-Cyrl": slot("uz-Cyrl") };
}

/** Сохранённая картинка проходит насквозь, выбранная — загружается в S3. */
function resolveKey(slot: Slot): Promise<string> {
  return slot.key ? Promise.resolve(slot.key) : uploadPhoto(slot.file!);
}
