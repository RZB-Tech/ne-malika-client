"use client";

import { useEffect, useState } from "react";
import { Check, ImagePlus, Sparkles, Wand2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAdminImageGenControllerDescribe,
  useAdminImageGenControllerGenerate,
} from "@/lib/api/generated/endpoints/image-gen-admin/image-gen-admin";
import type {
  GenerateImagesDtoQuality,
  GenerateImagesDtoSize,
  GenerateImagesDtoStyle,
} from "@/lib/api/generated/schemas";
import { storedPhoto, type UploadedPhoto } from "@/components/seller/photo-dropzone";
import { uploadPhoto } from "@/lib/api/upload";
import { cn } from "@/lib/utils";

type Format = "portrait" | "square";
type Tier = "1K" | "2K" | "3K" | "4K";

/**
 * Значения — в пикселях: тиры вроде «1K» модель не принимает, отвечает
 * «Expected WIDTHxHEIGHT». Вертикальные 3:4 — формат карточки на маркетплейсах,
 * заголовок и выноски помещаются только в него. В обеих колонках 4K упирается в
 * потолок модели по числу пикселей, больше не бывает.
 */
const SIZES: Record<Format, Record<Tier, GenerateImagesDtoSize>> = {
  portrait: {
    "1K": "960x1280",
    "2K": "1440x1920",
    "3K": "1728x2304",
    "4K": "2448x3264",
  },
  square: {
    "1K": "1024x1024",
    "2K": "2048x2048",
    "3K": "2560x2560",
    "4K": "2880x2880",
  },
};

const TIERS = ["1K", "2K", "3K", "4K"] as const satisfies readonly Tier[];

const STYLES = [
  { value: "infographic", label: "Инфографика" },
  { value: "photo", label: "Фото на белом" },
] as const satisfies readonly { value: GenerateImagesDtoStyle; label: string }[];

const FORMATS = [
  { value: "portrait", label: "Вертикальный 3:4" },
  { value: "square", label: "Квадрат 1:1" },
] as const satisfies readonly { value: Format; label: string }[];

const QUALITIES = [
  { value: "low", label: "Черновик" },
  { value: "medium", label: "Обычное" },
  { value: "high", label: "Высокое" },
] as const;

const COUNTS = [1, 2, 3, 4] as const;

interface Generated {
  key: string;
  url: string;
}

/**
 * Перерисовка фотографии товара. Исходник уходит модели как основа, поэтому на
 * выходе тот же товар — иначе карточка обещала бы одно, а приезжало другое.
 *
 * По умолчанию рисуется карточка-инфографика, как на Wildberries и Ozon: товар
 * на оформленном фоне, заголовок и выноски. Режим «фото на белом» оставлен для
 * случаев, когда нужна обычная студийная съёмка.
 *
 * Выбранные варианты возвращаются наружу: первый встаёт на место исходного фото,
 * остальные добавляются в конец галереи.
 */
export function PhotoAiDialog({
  photo,
  onClose,
  onApply,
}: {
  photo: UploadedPhoto | null;
  onClose: () => void;
  onApply: (replacement: UploadedPhoto[]) => void;
}) {
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState<number>(2);
  const [style, setStyle] = useState<GenerateImagesDtoStyle>("infographic");
  const [format, setFormat] = useState<Format>("portrait");
  const [tier, setTier] = useState<Tier>("1K");
  const [quality, setQuality] = useState<GenerateImagesDtoQuality>("medium");
  const [reference, setReference] = useState<{ key: string; url: string } | null>(
    null,
  );
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Generated[]>([]);
  const [resultFormat, setResultFormat] = useState<Format>("portrait");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const describeMutation = useAdminImageGenControllerDescribe();
  const generateMutation = useAdminImageGenControllerGenerate();

  const open = photo !== null;
  const photoKey = photo?.key;
  const size = SIZES[format][tier];

  const close = () => {
    setPrompt("");
    setResults([]);
    setPicked(new Set());
    setReference(null);
    onClose();
  };

  /** Инфографика вертикальная, студийное фото — квадратное: так их и снимают. */
  const changeStyle = (next: GenerateImagesDtoStyle) => {
    setStyle(next);
    setFormat(next === "photo" ? "square" : "portrait");
  };

  const describe = async () => {
    if (!photoKey) return;
    try {
      const res = (await describeMutation.mutateAsync({
        data: { photoKey, referenceKey: reference?.key, style },
      })) as unknown as { prompt: string };
      setPrompt(res.prompt);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось составить промпт",
      );
    }
  };

  const generate = async () => {
    if (!photoKey) return;
    if (prompt.trim().length < 3) {
      toast.error("Опишите, что нужно получить, или нажмите «Составить промпт»");
      return;
    }
    try {
      const res = (await generateMutation.mutateAsync({
        data: {
          photoKey,
          prompt: prompt.trim(),
          style,
          count,
          quality,
          size,
          referenceKey: reference?.key,
        },
      })) as unknown as Generated[];
      setResults(res);
      setResultFormat(format);
      setPicked(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Генерация не удалась");
    }
  };

  const apply = () => {
    const chosen = results.filter((r) => picked.has(r.key));
    if (chosen.length === 0) {
      toast.error("Выберите хотя бы одно изображение");
      return;
    }
    onApply(
      chosen.map((r) => storedPhoto(r.key, r.url, "Сгенерировано ИИ")),
    );
    close();
  };

  const pickReference = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const key = await uploadPhoto(file);
      setReference({ key, url: URL.createObjectURL(file) });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось загрузить референс",
      );
    } finally {
      setUploading(false);
    }
  };

  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Перерисовать фото через ИИ</DialogTitle>
          <DialogDescription>
            Модель видит текущее фото и рисует по нему карточку с тем же товаром.
            Выбранные варианты заменят исходное изображение.
          </DialogDescription>
        </DialogHeader>

        {!photoKey ? (
          <p className="text-sm text-muted-foreground">
            Это фото ещё не сохранено. Сохраните товар, а потом перерисуйте.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo!.url}
                alt="Исходное фото"
                className="size-28 shrink-0 rounded-xl bg-muted object-cover ring-1 ring-foreground/10"
              />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="ai-prompt">Промпт</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={describe}
                    disabled={describeMutation.isPending}
                  >
                    <Sparkles className="size-3.5" />
                    {describeMutation.isPending
                      ? "Смотрю фото…"
                      : "Составить промпт"}
                  </Button>
                </div>
                <Textarea
                  id="ai-prompt"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="ИИ сам опишет карточку — или напишите, что хотите получить"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Референс оформления</Label>
              {reference ? (
                <div className="flex items-center gap-3">
                  <img
                    src={reference.url}
                    alt="Референс"
                    className="size-20 rounded-xl bg-muted object-cover ring-1 ring-foreground/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">
                      Модель повторит фон, расположение текста и плашек — но
                      товар и надписи возьмёт из вашего фото. Нажмите «Составить
                      промпт» ещё раз, чтобы описание учло референс.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs"
                    onClick={() => setReference(null)}
                  >
                    <X className="size-3.5" />
                    Убрать
                  </Button>
                </div>
              ) : (
                <label
                  className={cn(
                    "flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl bg-muted/60 text-sm text-muted-foreground transition-colors hover:bg-muted/80",
                    uploading && "pointer-events-none opacity-60",
                  )}
                >
                  <ImagePlus className="size-4" />
                  {uploading
                    ? "Загружаем…"
                    : "Добавить образец карточки (необязательно)"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      void pickReference(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Что рисуем</Label>
                <Select
                  value={style}
                  onValueChange={(v) => changeStyle(v as GenerateImagesDtoStyle)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Формат</Label>
                <Select
                  value={format}
                  onValueChange={(v) => setFormat(v as Format)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Сколько вариантов</Label>
                <Select
                  value={String(count)}
                  onValueChange={(v) => setCount(Number(v))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTS.map((c) => (
                      <SelectItem key={c} value={String(c)}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Качество</Label>
                <Select
                  value={quality}
                  onValueChange={(v) => setQuality(v as GenerateImagesDtoQuality)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUALITIES.map((q) => (
                      <SelectItem key={q.value} value={q.value}>
                        {q.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Разрешение</Label>
                <Select value={tier} onValueChange={(v) => setTier(v as Tier)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-xs text-muted-foreground tabular">
              Итоговый размер: {size} px
              {tier === "4K" && " — максимум, который принимает модель"}
            </p>

            <Button
              type="button"
              className="gap-2"
              onClick={generate}
              disabled={generateMutation.isPending}
            >
              <Wand2 className="size-4" />
              {generateMutation.isPending ? "Рисую…" : "Сгенерировать"}
            </Button>

            {generateMutation.isPending && (
              <GeneratingGrid count={count} format={format} />
            )}

            {results.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Нажмите на понравившиеся — можно выбрать несколько.
                </p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {results.map((r) => (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => toggle(r.key)}
                      className={cn(
                        "relative overflow-hidden rounded-xl transition-all",
                        resultFormat === "portrait"
                          ? "aspect-[3/4]"
                          : "aspect-square",
                        picked.has(r.key)
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-popover"
                          : "ring-1 ring-foreground/10 hover:ring-foreground/25",
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={r.url}
                        alt="Вариант"
                        className="size-full object-cover"
                      />
                      {picked.has(r.key) && (
                        <span className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <Button type="button" onClick={apply} className="mt-2">
                  Заменить фото ({picked.size})
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * Ожидание генерации. Обычная «пульсирующая» заглушка на минуте ожидания
 * читается как зависшая страница, поэтому здесь блик бежит по плитке, плитки
 * оживают по очереди, а счётчик показывает, что процесс идёт и сколько уже
 * длится — это единственное, что admin реально может отслеживать.
 */
function GeneratingGrid({
  count,
  format,
}: {
  count: number;
  format: Format;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "shimmer grid place-items-center rounded-xl bg-muted/70",
              format === "portrait" ? "aspect-[3/4]" : "aspect-square",
            )}
            style={{ animationDelay: `${i * 220}ms` }}
          >
            <Wand2
              className="size-6 animate-pulse text-muted-foreground/45"
              style={{ animationDelay: `${i * 220}ms` }}
            />
          </div>
        ))}
      </div>
      <p className="tabular text-xs text-muted-foreground">
        {`Рисуем ${count} ${count === 1 ? "вариант" : "варианта"}… ${seconds} с`}
        {seconds > 45 && " — почти готово, крупные размеры рисуются дольше"}
      </p>
    </div>
  );
}
