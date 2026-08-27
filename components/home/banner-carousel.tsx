"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { PageContainer } from "@/components/layout/page-container";
import { useT } from "@/components/providers/i18n-provider";
import { BANNER_ASPECT_CSS, bannerImageUrl, type PublicBanner } from "@/lib/api/banners";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

const SLIDE_WIDTH = "w-[92%] sm:w-[86%] lg:w-[82%]";

export function BannerCarousel({ banners }: { banners: PublicBanner[] }) {
  const { t, locale } = useT();
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = banners.length;

  const go = useCallback(
    (next: number) => {
      const track = trackRef.current;
      if (!track || count === 0) return;

      const target = track.children[((next % count) + count) % count];
      if (!(target instanceof HTMLElement)) return;

      track.scrollTo({
        left: target.offsetLeft,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      });
    },
    [count],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let nearest = 0;
        let best = Infinity;

        Array.from(track.children).forEach((child, i) => {
          if (!(child instanceof HTMLElement)) return;
          const distance = Math.abs(child.offsetLeft + child.offsetWidth / 2 - center);
          if (distance < best) {
            best = distance;
            nearest = i;
          }
        });

        setIndex(nearest);
      });
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, paused, index, go]);

  if (count === 0) return null;

  return (
    <PageContainer className="pt-4 sm:pt-6">
      <section
        aria-roledescription="carousel"
        aria-label={t("home.banners.label")}
        className="group relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={() => setPaused(true)}
        onPointerUp={() => setPaused(false)}
        onPointerCancel={() => setPaused(false)}
      >
        <div
          ref={trackRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto sm:gap-4"
        >
          {banners.map((banner, i) => (
            <BannerSlide
              key={banner.id}
              banner={banner}
              src={bannerImageUrl(banner, locale)}
              eager={i === 0}
            />
          ))}
        </div>

        {count > 1 && (
          <>
            <ArrowButton side="left" label={t("home.banners.prev")} onClick={() => go(index - 1)} />
            <ArrowButton
              side="right"
              label={t("home.banners.next")}
              onClick={() => go(index + 1)}
            />

            {}
            <div className="mt-3 flex justify-center gap-1.5">
              {banners.map((banner, i) => (
                <button
                  key={banner.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={t("home.banners.goTo", { n: i + 1 })}
                  aria-current={i === index}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === index
                      ? "w-6 bg-foreground/70"
                      : "w-1.5 bg-foreground/25 hover:bg-foreground/40",
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

function BannerSlide({
  banner,
  src,
  eager,
}: {
  banner: PublicBanner;
  src: string | null;
  eager: boolean;
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
      className={cn("shrink-0 snap-start overflow-hidden rounded-2xl bg-muted", SLIDE_WIDTH)}
      style={{ aspectRatio: BANNER_ASPECT_CSS }}
    >
      {banner.linkUrl ? (
        <Link href={banner.linkUrl} className="block size-full">
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
        "absolute top-[calc(50%-0.75rem)] grid size-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-neutral-900 shadow-md transition-opacity hover:bg-white",
        side === "left" ? "left-3" : "right-3",
        "[@media(hover:hover)]:opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
