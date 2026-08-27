"use client";

import { useCallback, useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ChevronLeft, ChevronRight, X } from "@/components/icons";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";

export function PhotoLightbox({
  photos,
  startIndex,
  onClose,
  alt,
}: {
  photos: string[];
  startIndex: number | null;
  onClose: () => void;
  alt?: string;
}) {
  const { t } = useT();
  const open = startIndex !== null && photos.length > 0;

  const [index, setIndex] = useState(startIndex ?? 0);
  const [prevStart, setPrevStart] = useState(startIndex);

  if (startIndex !== prevStart) {
    setPrevStart(startIndex);
    if (startIndex !== null) setIndex(startIndex);
  }

  const count = photos.length;
  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (!open || count < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "ArrowRight") go(index + 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, count, index, go]);

  if (!open) return null;

  const src = photos[Math.min(index, count - 1)];

  return (
    <DialogPrimitive.Root open onOpenChange={(v) => !v && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/85 duration-100 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            {alt ?? t("common.photo")}
          </DialogPrimitive.Title>

          {}
          <button
            type="button"
            aria-label={t("common.close")}
            onClick={onClose}
            className="absolute inset-0 cursor-zoom-out"
          />

          <img
            src={src}
            alt={alt ?? ""}
            className="relative max-h-[92vh] max-w-[94vw] object-contain select-none"
            draggable={false}
          />

          <DialogPrimitive.Close asChild>
            <button
              type="button"
              aria-label={t("common.close")}
              className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <X className="size-5" />
            </button>
          </DialogPrimitive.Close>

          {count > 1 && (
            <>
              <NavButton
                side="left"
                label={t("common.prevPhoto")}
                onClick={() => go(index - 1)}
              />
              <NavButton
                side="right"
                label={t("common.nextPhoto")}
                onClick={() => go(index + 1)}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white tabular backdrop-blur-sm">
                {index + 1} / {count}
              </div>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function NavButton({
  side,
  label,
  onClick,
}: {
  side: "left" | "right";
  label: string;
  onClick: () => void;
}) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20",
        side === "left" ? "left-3" : "right-3",
      )}
    >
      <Icon className="size-6" />
    </button>
  );
}
