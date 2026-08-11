"use client";

import { LanguageSwitch } from "@/components/shared/language-switch";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useT } from "@/components/providers/i18n-provider";

export function SiteFooter() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      {/* На узком экране строки идут друг под другом, на широком — через точку. */}
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center text-center gap-1 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-center sm:gap-2 sm:px-8 lg:px-10">
        <span>
          © {year} {t("brand.name")}. {t("footer.rights")}
        </span>
        <span aria-hidden className="hidden sm:inline">
          ·
        </span>
        <span>{t("footer.disclaimer")}</span>
      </div>

      {/* Язык и тема жили в бургере, а его в шапке больше нет. На телефоне их
          ищут внизу страницы — это единственное оставшееся место, где им не
          тесно. На широком экране они по-прежнему во второй строке шапки. */}
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
