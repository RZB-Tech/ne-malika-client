"use client";

import { useState } from "react";
import { Check, Sparkles, Wand2 } from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/lib/api/generated/schemas";
import { storedPhoto, type UploadedPhoto } from "@/components/seller/photo-dropzone";
import { cn } from "@/lib/utils";

/**
 * Разрешение и формат — две независимые ручки, вместе они дают строку size.
 * «4K» здесь упирается в лимит модели по пикселям: 2880×2880 для квадрата,
 * 3840×2160 для горизонтали — больше API не принимает.
 */
const FORMATS = [
  { value: "square", label: "Квадрат" },
  { value: "portrait", label: "Портрет" },
  { value: "landscape", label: "Альбом" },
] as const;

const RESOLUTIONS = [
  { value: "1k", label: "1K" },
  { value: "2k", label: "2K" },
  { value: "4k", label: "4K" },
] as const;

type Format = (typeof FORMATS)[number]["value"];
type Resolution = (typeof RESOLUTIONS)[number]["value"];

const SIZE_BY: Record<Resolution, Record<Format, GenerateImagesDtoSize>> = {
  "1k": { square: "1024x1024", portrait: "1024x1536", landscape: "1536x1024" },
  "2k": { square: "2048x2048", portrait: "1728x2560", landscape: "2560x1728" },
  "4k": { square: "2880x2880", portrait: "2160x3840", landscape: "3840x2160" },
};

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
  const [quality, setQuality] = useState<GenerateImagesDtoQuality>("medium");
  const [format, setFormat] = useState<Format>("square");
  const [resolution, setResolution] = useState<Resolution>("1k");
  const [results, setResults] = useState<Generated[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const describeMutation = useAdminImageGenControllerDescribe();
  const generateMutation = useAdminImageGenControllerGenerate();

  const open = photo !== null;
  // Генерировать можно только по сохранённому фото: у только что выбранного
  // файла ещё нет ключа в S3, а модель работает с тем, что лежит в хранилище.
  const photoKey = photo?.key;

  const close = () => {
    setPrompt("");
    setResults([]);
    setPicked(new Set());
    onClose();
  };

  const describe = async () => {
    if (!photoKey) return;
    try {
      const res = (await describeMutation.mutateAsync({
        data: { photoKey },
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
          count,
          quality,
          size: SIZE_BY[resolution][format],
        },
      })) as unknown as Generated[];
      setResults(res);
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
            Модель видит текущее фото и рисует тот же товар заново. Выбранные
            варианты заменят исходное изображение.
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
                className="size-28 shrink-0 rounded-lg border border-border object-cover"
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
                  placeholder="ИИ сам опишет товар — или напишите, что хотите получить"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                <Select
                  value={resolution}
                  onValueChange={(v) => setResolution(v as Resolution)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOLUTIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
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

            <p className="text-xs text-muted-foreground tabular">
              Итоговый размер: {SIZE_BY[resolution][format]} px
              {resolution === "4k" && " — максимум, который принимает модель"}
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
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Array.from({ length: count }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
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
                        "relative aspect-square overflow-hidden rounded-lg border-2 transition-colors",
                        picked.has(r.key)
                          ? "border-primary"
                          : "border-transparent hover:border-border",
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
