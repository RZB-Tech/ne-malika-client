"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useT } from "@/components/providers/i18n-provider";

export function SiteFooter() {
  const { t } = useT();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("footer.buyers"),
      links: [
        { label: t("footer.catalog"), href: "/" },
        { label: t("footer.stores"), href: "/" },
      ],
    },
    {
      title: t("footer.sellers"),
      links: [
        { label: t("footer.becomeSeller"), href: "/seller" },
        { label: t("footer.addProduct"), href: "/seller/products/new" },
        { label: t("footer.tariffs"), href: "#" },
        { label: t("nav.admin"), href: "/admin" },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-xs">
          <Logo className="mb-3" />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t("footer.aboutText")}
          </p>
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Send className="size-4" /> Telegram
          </a>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-3 text-sm font-semibold text-foreground">{col.title}</h4>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>© {year} {t("brand.name")}. {t("footer.rights")}</span>
          <span>{t("footer.disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
