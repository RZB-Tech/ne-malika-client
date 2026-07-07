"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";

export interface UploadedPhoto {
  id: string;
  url: string;
  name: string;
  originalKb: number;
  compressedKb: number;
}

const MAX = 10;

/** Resize/compress an image to max 1200px on the long edge via canvas. */
async function compress(file: File): Promise<UploadedPhoto> {
  const dataUrl = await new Promise<string>((res) => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result as string);
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((res) => {
    const i = new Image();
    i.onload = () => res(i);
    i.src = dataUrl;
  });
  const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = canvas.toDataURL("image/jpeg", 0.82);
  return {
    id: crypto.randomUUID(),
    url: out,
    name: file.name,
    originalKb: Math.round(file.size / 1024),
    compressedKb: Math.round((out.length * 0.75) / 1024),
  };
}

export function PhotoDropzone({
  photos,
  onChange,
}: {
  photos: UploadedPhoto[];
  onChange: (p: UploadedPhoto[]) => void;
}) {
  const { t } = useT();
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setBusy(true);
      const room = MAX - photos.length;
      const picked = Array.from(files).filter((f) => f.type.startsWith("image/")).slice(0, room);
      const compressed = await Promise.all(picked.map(compress));
      onChange([...photos, ...compressed]);
      setBusy(false);
    },
    [photos, onChange],
  );

  const remove = (id: string) => onChange(photos.filter((p) => p.id !== id));
  const makeMain = (id: string) => {
    const idx = photos.findIndex((p) => p.id === id);
    if (idx <= 0) return;
    const next = [...photos];
    const [item] = next.splice(idx, 1);
    next.unshift(item);
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/40",
          photos.length >= MAX && "pointer-events-none opacity-50",
        )}
      >
        <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
          <ImagePlus className="size-6" />
        </div>
        <p className="mt-3 text-sm font-medium">{t("seller.add.dropHere")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {busy ? t("common.loading") : t("seller.add.photosHint")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => add(e.target.files)}
        />
      </div>

      {photos.length > 0 && (
        <>
          <div className="text-xs text-muted-foreground tabular">
            {photos.length} / {MAX}
          </div>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
            {photos.map((p, i) => (
              <div key={p.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={p.name} className="size-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                    <Star className="size-2.5 fill-current" />
                    {t("seller.add.mainPhoto")}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-[9px] text-white tabular opacity-0 transition-opacity group-hover:opacity-100">
                  {p.originalKb}→{p.compressedKb} KB
                </div>
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makeMain(p.id)}
                      className="grid size-6 place-items-center rounded bg-black/60 text-white hover:bg-black/80"
                      title={t("seller.add.mainPhoto")}
                    >
                      <Star className="size-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="grid size-6 place-items-center rounded bg-black/60 text-white hover:bg-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
