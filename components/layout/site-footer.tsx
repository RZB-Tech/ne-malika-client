"use client";

import Link from "next/link";
import { Store, Tag } from "@/components/icons";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useT } from "@/components/providers/i18n-provider";
import { SUPPORT_HANDLE, SUPPORT_URL } from "@/lib/telegram";
import { PageContainer } from "./page-container";

export function SiteFooter() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      {}
      <PageContainer className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 border-b border-border py-5">
        <Link
          href="/stores"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Store className="size-4 text-muted-foreground" />
          {t("nav.stores")}
        </Link>

        <Link
          href="/seller/profile"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <Tag className="size-4 text-muted-foreground" />
          {t("footer.sell")}
        </Link>

        <a
          href={SUPPORT_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
        >
          <TelegramIcon className="size-4 text-muted-foreground" />
          {t("footer.support")}
          <span className="text-muted-foreground">{SUPPORT_HANDLE}</span>
        </a>
      </PageContainer>

      <PageContainer className="flex flex-col items-center justify-center gap-1 py-8 text-center text-xs text-muted-foreground sm:flex-row sm:gap-2">
        <span>
          © {year} {t("brand.name")}. {t("footer.rights")}
        </span>
        <span aria-hidden className="hidden sm:inline">
          ·
        </span>
        <span>{t("footer.disclaimer")}</span>
      </PageContainer>

      <div className="flex items-center justify-center gap-1 pb-8 md:hidden">
        <LanguageSwitch />
        <AnimatedThemeToggler
          aria-label={t("common.theme")}
          className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-4"
        />
      </div>
    </footer>
  );
}
