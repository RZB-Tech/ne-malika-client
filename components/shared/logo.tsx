"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";

/** Brand mark: a stylized CPU/core glyph + wordmark. */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  const { t } = useT();
  return (
    <Link href="/" className={cn("group flex items-center gap-2", className)}>
      <span className="relative grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="7" y="7" width="10" height="10" rx="2" />
          <rect x="10.5" y="10.5" width="3" height="3" rx="0.5" fill="currentColor" stroke="none" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6.5 3.5l0 0M17.5 3.5" />
          <path d="M9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2" />
        </svg>
      </span>
      {showText && (
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          {t("brand.name")}
        </span>
      )}
    </Link>
  );
}
