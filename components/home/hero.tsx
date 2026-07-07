"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Sparkles, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/shared/search-bar";
import { useT } from "@/components/providers/i18n-provider";
import { formatNumber } from "@/lib/format";
import { stores, cities } from "@/lib/data";

const LightRays = dynamic(() => import("@/components/magicui/light-rays"), {
  ssr: false,
});

export function Hero() {
  const { t, locale } = useT();

  const stats = [
    { value: stores.length * 6 + 2, label: t("home.statSellers") },
    { value: 8400, label: t("home.statProducts") },
    { value: cities.length, label: t("home.statCities") },
  ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      {/* soft primary glow — subtle on light, richer on dark */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(62%_55%_at_50%_-8%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_70%)]" />

      {/* Light Rays: multiply so the beams read as soft colour on white,
          normal blend over the dark theme background */}
      <LightRays
        raysOrigin="top-center"
        raysColor="#6f9bff"
        raysSpeed={0.9}
        lightSpread={1.1}
        rayLength={2.4}
        fadeDistance={1.2}
        followMouse
        mouseInfluence={0.08}
        noiseAmount={0.05}
        className="opacity-45 mix-blend-multiply dark:opacity-70 dark:mix-blend-normal"
      />

      {/* bottom fade into page */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />

      <div className="relative mx-auto max-w-3xl px-4 pb-28 pt-20 text-center sm:px-6 sm:pt-24 md:pb-32 md:pt-28">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
          <Sparkles className="size-3.5 text-primary" />
          {t("home.heroBadge")}
        </div>

        <h1 className="font-heading text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {t("home.heroTitle")}
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {t("home.heroSubtitle")}
        </p>

        <div className="mx-auto mt-8 max-w-xl">
          <SearchBar
            size="lg"
            withButton
            placeholder={t("home.heroSearchPlaceholder")}
            className="[&_input]:bg-card/80 [&_input]:shadow-sm [&_input]:backdrop-blur"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="gap-2">
            <Link href="/catalog">
              {t("home.heroCtaBrowse")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="gap-2 bg-card/60 backdrop-blur">
            <Link href="/seller">
              <Store className="size-4" />
              {t("home.heroCtaSell")}
            </Link>
          </Button>
        </div>

        <div className="mx-auto mt-14 grid max-w-md grid-cols-3 gap-4 border-t border-border pt-8">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="font-heading text-2xl font-bold tabular text-foreground sm:text-3xl">
                {formatNumber(s.value, locale)}
                <span className="text-primary">+</span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
