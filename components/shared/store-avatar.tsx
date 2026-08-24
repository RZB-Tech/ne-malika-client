"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Аватар магазина. Показывает загруженное продавцом фото, а если его нет (или
 * картинка не открылась — например, ключа ещё нет в бакете) — детерминированный
 * цветной квадрат с инициалом. Держим в одном месте, чтобы фото появлялось
 * везде одинаково: сайдбар кабинета, витрина магазина, блок продавца на
 * карточке товара, админский список.
 *
 * Размер и скругление задаёт вызывающий через `className`.
 */
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
  /** Чем заменить инициал в плейсхолдере (напр. иконка магазина). */
  fallback?: React.ReactNode;
}) {
  /** Сброс флага при смене src: аватар мог «доехать» позже (чаты опрашиваются), —
   * без этого однажды битый URL навсегда оставлял букву-плейсхолдер. */
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
