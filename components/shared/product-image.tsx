"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { getCategory } from "@/lib/data";

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
  fit?: "cover" | "contain" | "natural";
}) {
  const [failed, setFailed] = useState(false);

  const [shown, setShown] = useState(src);
  if (src !== shown) {
    setShown(src);
    setFailed(false);
  }

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
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `radial-gradient(120% 120% at 30% 15%, oklch(0.33 0.055 ${hue}) 0%, oklch(0.26 0.045 ${hue}) 55%, oklch(0.2 0.035 ${hue}) 100%)`,
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      {showImage && natural ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src!}
          alt={alt ?? ""}
          className="relative z-10 block h-auto w-full"
          onError={() => setFailed(true)}
        />
      ) : showImage ? (
        <>
          {fit === "contain" && (
            <div className="absolute inset-0 z-[5] bg-muted" />
          )}
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
