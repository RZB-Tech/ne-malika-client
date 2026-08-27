"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function StoreAvatar({
  name,
  hue,
  src,
  className,
  fallback,
}: {
  name: string;
  hue: number;
  src?: string | null;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);
  const [shown, setShown] = useState(src);
  if (src !== shown) {
    setShown(src);
    setFailed(false);
  }
  const showImage = Boolean(src) && !failed;

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden font-bold text-white",
        className,
      )}
      style={showImage ? undefined : { background: `oklch(0.55 0.17 ${hue})` }}
    >
      {showImage ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src!}
          alt={name}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        (fallback ?? name.slice(0, 1))
      )}
    </span>
  );
}
