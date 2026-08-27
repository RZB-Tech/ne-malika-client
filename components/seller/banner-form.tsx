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
import { cn } from "@/lib/utils";
import {
  getSellerBannersControllerListQueryKey,
  useSellerBannersControllerCreate,
  useSellerBannersControllerUpdate,
} from "@/lib/api/generated/endpoints/banners-seller/banners-seller";

/**
 * Картинка одного языка: либо уже сохранённая (есть `key`), либо только что
 * выбранная (есть `file`). Загрузка в S3 откладывается до нажатия «Сохранить» —
 * иначе брошенная форма оставляла бы в бакете файлы, на которые никто не
 * ссылается.
 */
interface Slot {
  key?: string;
  file?: File;
  preview: string;
}

type Slots = Record<Locale, Slot | null>;

const EMPTY_SLOTS: Slots = { ru: null, "uz-Latn": null, "uz-Cyrl": null };

/**
 * Форма баннера магазина: три картинки (по одной на язык интерфейса), название
 * и ссылка.
 *
 * Одна форма на создание и на правку — поля совпадают, а разделять их значило бы
 * держать два экрана, расходящихся на первой же правке.
 *
 * Правку показываем только тем, у кого действующий MAX: гейт стоит на странице,
 * потому что он же решает, показывать ли форму вообще. `PATCH` на сервере тоже
 * закрыт тарифом — форма без гейта вела бы прямо в 403.
 *
 * Родитель обязан передавать `key={banner?.id ?? "new"}`: после удаления баннера
 * форма должна очиститься, а состояние полей живёт внутри и само по смене
 * пропса не сбросится.
 */
export function BannerForm({ banner }: { banner: Banner | null }) {
  const { t } = useT();
  const queryClient = useQueryClient();

  const createMutation = useSellerBannersControllerCreate();
  const updateMutation = useSellerBannersControllerUpdate();

  const [title, setTitle] = useState(banner?.title ?? "");
  const [linkUrl, setLinkUrl] = useState(banner?.linkUrl ?? "");
  const [slots, setSlots] = useState<Slots>(() =>
    banner ? storedSlots(banner) : EMPTY_SLOTS,
  );
  const [saving, setSaving] = useState(false);

  /**
   * Blob-ссылки предпросмотра живут, пока их не отозвать: без этого каждая
   * переоткрытая страница оставляет во вкладке по мегабайту на картинку.
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
        t(`seller.banner.err.${problem}`, { sizes: BANNER_FORMATS_LABEL }),
      );
      return;
    }
    const preview = URL.createObjectURL(file);
    objectUrls.current.push(preview);
    setSlots((s) => ({ ...s, [locale]: { file, preview } }));
  };

  /**
   * Одна картинка на все языки — обычный случай, когда текста на ней нет.
   * Ставим один и тот же объект слота во все три поля: по нему же загрузка
   * потом поймёт, что файл один, и отправит его в S3 однажды.
   */
  const copyToAll = (from: Locale) => {
    setSlots((s) => {
      const source = s[from];
      if (!source) return s;
      return { ru: source, "uz-Latn": source, "uz-Cyrl": source };
    });
    toast.success(t("seller.banner.copiedToAll"));
  };

  /**
   * Есть ли что сохранять.
   *
   * Не украшение: сохранение одобренного баннера без единой правки сняло бы его
   * с главной и отправило на повторную проверку — сервер возвращает в `pending`
   * любой `PATCH`, независимо от того, изменилось ли хоть одно поле. Кнопка,
   * которая ничего не меняет, но убирает баннер из карусели на несколько часов,
   * — худшее, что может быть на этой странице.
   *
   * У нового баннера сравнивать не с чем: сохранять всегда есть что.
   */
  const dirty = !banner || changedFrom(banner, title, linkUrl, slots);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (title.trim().length < 2) {
      toast.error(t("seller.banner.needTitle"));
      return;
    }
    if (locales.some((l) => !slots[l])) {
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
        photoUzCyrl: keys["uz-Cyrl"],
        /**
         * Пустую строку шлём как есть, а не `undefined`: ключа не было бы в
         * теле запроса вовсе, и очистка поля молча оставляла бы старую ссылку.
         */
        linkUrl: linkUrl.trim(),
      };

      if (banner) {
        await updateMutation.mutateAsync({ id: banner.id, data });
      } else {
        await createMutation.mutateAsync({ data });
      }

      /**
       * Выбранные файлы становятся сохранёнными ключами: иначе форма считала бы
       * себя изменённой сразу после удачного сохранения и предлагала отправить
       * на проверку то же самое второй раз. Предпросмотр оставляем прежний —
       * blob уже в памяти вкладки, а картинка в S3 та же самая.
       */
      setSlots((s) => ({
        ru: { key: keys.ru, preview: s.ru?.preview ?? "" },
        "uz-Latn": { key: keys["uz-Latn"], preview: s["uz-Latn"]?.preview ?? "" },
        "uz-Cyrl": { key: keys["uz-Cyrl"], preview: s["uz-Cyrl"]?.preview ?? "" },
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
          <p className="text-xs text-muted-foreground">
            {t("seller.banner.nameHint")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>{t("seller.banner.images")}</Label>
            <p className="text-xs text-muted-foreground">
              {t("seller.banner.hint", { sizes: BANNER_FORMATS_LABEL })}
            </p>
          </div>
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
          <Label htmlFor="seller-banner-link">{t("seller.banner.link")}</Label>
          <Input
            id="seller-banner-link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="/product/12"
          />
          <p className="text-xs text-muted-foreground">
            {t("seller.banner.linkHint")}
          </p>
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

/**
 * Предупреждение о повторной модерации.
 *
 * Для одобренного баннера это про потерю показов: он уходит с главной до
 * решения модератора, и без этой строки продавец, поправивший опечатку в
 * названии, решит, что площадка сломалась. Для ждущего и отклонённого
 * последствие то же самое, но терять нечего — там это просто справка, поэтому
 * и вида она обычного.
 */
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
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
          /* Сбрасываем значение: иначе повторный выбор того же файла молчит. */
          e.target.value = "";
          if (file) onPick(file);
        }}
      />
    </div>
  );
}

/** Отличается ли то, что в полях, от того, что уже сохранено. */
function changedFrom(
  banner: Banner,
  title: string,
  linkUrl: string,
  slots: Slots,
): boolean {
  return (
    title.trim() !== banner.title ||
    linkUrl.trim() !== (banner.linkUrl ?? "") ||
    /* Слот без `key` — это выбранный, но ещё не загруженный файл. */
    locales.some((l) => slots[l]?.key !== bannerPhotoKey(banner, l))
  );
}

/** Уже сохранённые картинки баннера — как заполненные слоты формы. */
function storedSlots(banner: Banner): Slots {
  const slot = (locale: Locale): Slot => {
    const key = bannerPhotoKey(banner, locale);
    return { key, preview: photoUrl(key) ?? "" };
  };
  return {
    ru: slot("ru"),
    "uz-Latn": slot("uz-Latn"),
    "uz-Cyrl": slot("uz-Cyrl"),
  };
}

/**
 * Ключи трёх картинок для тела запроса: сохранённые проходят насквозь, выбранные
 * загружаются в S3.
 *
 * Кэш по объекту слота нужен из-за кнопки «Поставить на все языки»: она ставит
 * один и тот же слот во все три поля, и без кэша один файл уезжал бы на сервер
 * трижды. На мобильном интернете это втрое дольше и втрое дороже ровно за то же
 * самое.
 */
async function resolveSlotKeys(slots: Slots): Promise<Record<Locale, string>> {
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

  const [ru, uzLatn, uzCyrl] = await Promise.all([
    keyOf(slots.ru!),
    keyOf(slots["uz-Latn"]!),
    keyOf(slots["uz-Cyrl"]!),
  ]);

  return { ru, "uz-Latn": uzLatn, "uz-Cyrl": uzCyrl };
}
