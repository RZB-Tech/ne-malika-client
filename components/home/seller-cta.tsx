"use client";

import Link from "next/link";
import { ArrowRight, BarChart3, Send, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";

export function SellerCta() {
  const { t } = useT();
  const perks = [
    { Icon: Store, label: { ru: "Бесплатное размещение", "uz-Latn": "Bepul joylashtirish", "uz-Cyrl": "Бепул жойлаштириш" } },
    { Icon: Send, label: { ru: "Клиенты в Telegram", "uz-Latn": "Telegramda mijozlar", "uz-Cyrl": "Телеграмда мижозлар" } },
    { Icon: BarChart3, label: { ru: "Аналитика переходов", "uz-Latn": "O‘tishlar tahlili", "uz-Cyrl": "Ўтишлар таҳлили" } },
  ];
  const { locale } = useT();
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-14 sm:px-8 lg:px-10">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-[oklch(0.19_0.02_264)] px-6 py-12 text-white sm:px-12 sm:py-14">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(80%_80%_at_50%_0%,black,transparent)]" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
            {t("home.ctaTitle")}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/65">{t("home.ctaText")}</p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            {perks.map((p, i) => (
              <span key={i} className="inline-flex items-center gap-2 text-sm text-white/80">
                <p.Icon className="size-4 text-[#8fb3ff]" />
                {p.label[locale]}
              </span>
            ))}
          </div>

          <Button asChild size="lg" className="mt-8 gap-2">
            <Link href="/seller">
              {t("home.ctaButton")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
