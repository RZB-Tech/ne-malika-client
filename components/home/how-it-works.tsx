"use client";

import { Search, Send, Handshake } from "lucide-react";
import { useT } from "@/components/providers/i18n-provider";

export function HowItWorks() {
  const { t } = useT();
  const steps = [
    { Icon: Search, title: t("home.how1Title"), text: t("home.how1Text") },
    { Icon: Send, title: t("home.how2Title"), text: t("home.how2Text") },
    { Icon: Handshake, title: t("home.how3Title"), text: t("home.how3Text") },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <h2 className="mb-8 text-center font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {t("home.howTitle")}
      </h2>
      <div className="grid gap-5 sm:grid-cols-3">
        {steps.map((s, i) => (
          <div
            key={i}
            className="relative rounded-2xl border border-border bg-card p-6"
          >
            <span className="absolute right-5 top-4 font-heading text-4xl font-bold text-muted/60 tabular">
              {i + 1}
            </span>
            <div className="mb-4 grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
              <s.Icon className="size-5" />
            </div>
            <h3 className="mb-1.5 font-medium text-foreground">{s.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
