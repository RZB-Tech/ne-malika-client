"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Flag } from "@/components/icons/flag";
import { useI18n } from "@/components/providers/i18n-provider";
import { locales, localeNames, localeShort } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function LanguageSwitch() {
  const { locale, setLocale } = useI18n();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 px-2 text-muted-foreground hover:text-foreground"
        >
          <Flag locale={locale} />
          <span className="text-xs font-semibold">{localeShort[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className={cn(
              "gap-2",
              l === locale && "font-medium text-primary",
            )}
          >
            <Flag locale={l} className="size-5" />
            {localeNames[l]}
            <span className="ml-auto text-xs font-semibold text-muted-foreground">
              {localeShort[l]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
