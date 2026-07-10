"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { getCategory } from "@/lib/data";

/**
 * Product artwork. When a real photo URL is available (`src`) we render it and
 * fall back to a deterministic, brand-tinted category tile if it fails to load
 * or is absent — so local dev without a live S3 bucket still looks intentional.
 */
export function ProductImage({
  hue,
  categorySlug,
  src,
  alt,
  className,
  iconClassName,
  fit = "cover",
}: {
  hue: number;
  categorySlug: string;
  src?: string | null;
  alt?: string;
  className?: string;
  iconClassName?: string;
  /**
   * "cover" (default) crops to fill — good for thumbnails/tiles.
   * "contain" shows the whole photo without cropping (letterboxed on a
   * neutral backdrop) — use for the main product view.
   * "natural" lets the photo set the height: no crop, no letterbox. The
   * caller must not impose an aspect ratio. Falls back to a 4:3 tile when
   * there is no photo, since a flow image is what gave the box its height.
   */
  fit?: "cover" | "contain" | "natural";
}) {
  const [failed, setFailed] = useState(false);
  const iconName = getCategory(categorySlug)?.icon ?? "Box";
  const showImage = Boolean(src) && !failed;
  const natural = fit === "natural";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden text-foreground/55",
        natural && !showImage && "aspect-[4/3]",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 30% 15%, oklch(0.965 0.045 ${hue}) 0%, oklch(0.9 0.06 ${hue}) 48%, oklch(0.82 0.085 ${hue}) 100%)`,
      }}
    >
      {/* dark-theme wash overlays the light gradient */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `radial-gradient(120% 120% at 30% 15%, oklch(0.33 0.055 ${hue}) 0%, oklch(0.26 0.045 ${hue}) 55%, oklch(0.2 0.035 ${hue}) 100%)`,
        }}
      />
      {/* dotted texture */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      {showImage && natural ? (
        // In flow, not absolute: the image's own height becomes the box's height.
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src!}
          alt={alt ?? ""}
          className="relative z-10 block h-auto w-full"
          onError={() => setFailed(true)}
        />
      ) : showImage ? (
        <>
          {/* Neutral backdrop so letterbox areas don't show the colored tile. */}
          {fit === "contain" && (
            <div className="absolute inset-0 z-[5] bg-muted" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src!}
            alt={alt ?? ""}
            className={cn(
              "absolute inset-0 z-10 h-full w-full",
              fit === "contain" ? "object-contain" : "object-cover",
            )}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <CategoryIcon
          name={iconName}
          className={cn("relative z-10 drop-shadow-sm", iconClassName)}
          strokeWidth={1.25}
        />
      )}
    </div>
  );
}
