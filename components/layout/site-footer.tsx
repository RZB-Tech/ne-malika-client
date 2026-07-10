"use client";

import { Send } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { useT } from "@/components/providers/i18n-provider";

export function SiteFooter() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-5">
          <Logo />
          <a
            href="https://t.me"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Send className="size-4" /> Telegram
          </a>
        </div>

        {/* На узком экране строки идут друг под другом, на широком — через точку. */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2">
          <span>
            © {year} {t("brand.name")}. {t("footer.rights")}
          </span>
          <span aria-hidden className="hidden sm:inline">
            ·
          </span>
          <span>{t("footer.disclaimer")}</span>
        </div>
      </div>
    </footer>
  );
}
