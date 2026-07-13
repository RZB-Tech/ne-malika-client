"use client";

import { useT } from "@/components/providers/i18n-provider";

export function SiteFooter() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      {/* На узком экране строки идут друг под другом, на широком — через точку. */}
      <div className="mx-auto flex max-w-[1600px] flex-col gap-1 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-2 sm:px-8 lg:px-10">
        <span>
          © {year} {t("brand.name")}. {t("footer.rights")}
        </span>
        <span aria-hidden className="hidden sm:inline">
          ·
        </span>
        <span>{t("footer.disclaimer")}</span>
      </div>
    </footer>
  );
}
