"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { PageContainer } from "@/components/layout/page-container";
import { useT } from "@/components/providers/i18n-provider";
import { bannerImageUrl, type Banner } from "@/lib/api/banners";
import { cn } from "@/lib/utils";

/** Пауза между автопереключениями. */
const AUTOPLAY_MS = 6000;

/** Сколько пикселей пальца считаем осознанным свайпом, а не дрожью руки. */
const SWIPE_THRESHOLD = 40;

/**
 * Карусель баннеров над каталогом.
 *
 * Картинка своя на каждый язык — текст акции нарисован прямо на ней. Язык
 * живёт в localStorage и до монтирования неизвестен, поэтому первый кадр всегда
 * русский, а затем меняется вместе с остальным интерфейсом.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const { t, locale } = useT();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = banners.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  /**
   * Автопрокрутка. Стоит на паузе под курсором и при `prefers-reduced-motion`:
   * баннер, уезжающий сам по себе, — ровно то движение, от которого эта
   * настройка защищает.
   */
  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % count),
      AUTOPLAY_MS,
    );
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <PageContainer className="pt-4 sm:pt-6">
      <section
        aria-roledescription="carousel"
        aria-label={t("home.banners.label")}
        className="group relative overflow-hidden rounded-2xl bg-muted"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          touchStartX.current = null;
          if (start === null) return;
          const delta = e.changedTouches[0].clientX - start;
          if (Math.abs(delta) < SWIPE_THRESHOLD) return;
          go(index + (delta < 0 ? 1 : -1));
        }}
      >
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((banner, i) => (
            <BannerSlide
              key={banner.id}
              banner={banner}
              src={bannerImageUrl(banner, locale)}
              /** Первый баннер — LCP первого экрана, грузим его без очереди. */
              eager={i === 0}
              hidden={i !== index}
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <ArrowButton
              side="left"
              label={t("home.banners.prev")}
              onClick={() => go(index - 1)}
            />
            <ArrowButton
              side="right"
              label={t("home.banners.next")}
              onClick={() => go(index + 1)}
            />

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t("home.banners.goTo", { n: i + 1 })}
                  aria-current={i === index}
                  className={cn(
                    "h-1.5 rounded-full bg-white/60 shadow-sm transition-all",
                    i === index ? "w-6 bg-white" : "w-1.5 hover:bg-white/80",
                  )}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </PageContainer>
  );
}

/**
 * Один кадр. Пропорция разная: широкая полоса 31:10 на телефоне превратилась бы
 * в щель высотой в палец, поэтому там картинка кадрируется по центру.
 */
function BannerSlide({
  banner,
  src,
  eager,
  hidden,
}: {
  banner: Banner;
  src: string | null;
  eager: boolean;
  hidden: boolean;
}) {
  const image = src ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={banner.title}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      draggable={false}
      className="size-full object-cover"
    />
  ) : (
    <div className="size-full bg-muted" />
  );

  return (
    <div
      className="w-full shrink-0 aspect-[3/2] sm:aspect-[21/9] lg:aspect-[31/10]"
      aria-hidden={hidden}
    >
      {banner.linkUrl ? (
        <Link
          href={banner.linkUrl}
          className="block size-full"
          /** Скрытые кадры не должны ловить Tab: фокус уезжал бы за край. */
          tabIndex={hidden ? -1 : undefined}
        >
          {image}
        </Link>
      ) : (
        image
      )}
    </div>
  );
}

function ArrowButton({
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
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-neutral-900 shadow-md transition-opacity hover:bg-white",
        side === "left" ? "left-3" : "right-3",
        /* На тач-устройствах наведения нет — там стрелки видны всегда. */
        "[@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
