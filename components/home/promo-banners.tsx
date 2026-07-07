"use client";

import Link from "next/link";
import { ArrowRight, Cpu, Gamepad2, Truck } from "lucide-react";
import { useT } from "@/components/providers/i18n-provider";

export function PromoBanners() {
  const { locale } = useT();

  const banners = [
    {
      href: "/catalog?category=videocards&promo=1",
      hue: 262,
      Icon: Cpu,
      title: { ru: "Скидки на видеокарты", en: "Deals on graphics cards" },
      text: { ru: "До −20% на RTX и Radeon этой недели", en: "Up to −20% on RTX & Radeon this week" },
      cta: { ru: "К подборке", en: "Shop now" },
      big: true,
    },
    {
      href: "/catalog?category=computers",
      hue: 150,
      Icon: Gamepad2,
      title: { ru: "Готовые игровые ПК", en: "Prebuilt gaming PCs" },
      text: { ru: "Собраны и протестированы", en: "Built & tested" },
      cta: { ru: "Смотреть", en: "Browse" },
    },
    {
      href: "/seller",
      hue: 25,
      Icon: Truck,
      title: { ru: "Продавайте на Ядро", en: "Sell on Yadro" },
      text: { ru: "Бесплатное размещение", en: "Free listings" },
      cta: { ru: "Начать", en: "Start" },
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {banners.map((b, i) => (
          <Link
            key={i}
            href={b.href}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border p-6 transition-shadow hover:shadow-md ${
              b.big ? "md:col-span-2 lg:col-span-2" : ""
            }`}
            style={{
              backgroundImage: `linear-gradient(135deg, oklch(0.62 0.17 ${b.hue}) 0%, oklch(0.5 0.19 ${b.hue}) 100%)`,
            }}
          >
            <div className="pointer-events-none absolute -right-6 -top-8 opacity-20">
              <b.Icon className="size-40 text-white" strokeWidth={1} />
            </div>
            <div className="relative">
              <h3 className="font-heading text-xl font-bold text-white">
                {b.title[locale]}
              </h3>
              <p className="mt-1.5 text-sm text-white/80">{b.text[locale]}</p>
            </div>
            <span className="relative mt-6 inline-flex w-fit items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-medium text-white backdrop-blur transition-colors group-hover:bg-white/25">
              {b.cta[locale]}
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
