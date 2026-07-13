"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { SearchBar } from "@/components/shared/search-bar";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { locales, localeNames, localeShort } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const { t } = useT();
  const { locale, setLocale } = useI18n();
  const { isAuthenticated, isAdmin, isHydrated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle className="text-left">
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <SearchBar className="mb-5" />

              {isAuthenticated ? (
                <Button asChild className="w-full gap-2">
                  <Link
                    href={isAdmin ? "/admin" : "/seller"}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Store className="size-4" />
                    {isAdmin ? t("nav.admin") : t("nav.sellerCabinet")}
                  </Link>
                </Button>
              ) : (
                <LoginDialog>
                  <Button className="w-full gap-2">
                    <Store className="size-4" />
                    {t("nav.becomeSeller")}
                  </Button>
                </LoginDialog>
              )}

              <div className="mt-6 space-y-4 border-t border-border pt-5">
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    {t("common.language")}
                  </p>
                  <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
                    {locales.map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setLocale(l)}
                        aria-pressed={l === locale}
                        title={localeNames[l]}
                        className={cn(
                          "rounded-md py-1.5 text-xs font-semibold transition-colors",
                          l === locale
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {localeShort[l]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t("common.theme")}
                  </p>
                  <AnimatedThemeToggler
                    fromCenter
                    aria-label={t("common.theme")}
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[1.15rem]"
                  />
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Logo />

        <div className="mx-2 hidden max-w-xl flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <div className="hidden md:block">
            <LanguageSwitch />
          </div>
          <AnimatedThemeToggler
            aria-label={t("common.theme")}
            className="hidden size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 md:inline-flex dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
          />
          {!isHydrated ? (
            // Placeholder until auth state is known (avoids logged-out flash).
            <div
              className="ml-1 size-8 shrink-0 rounded-full bg-muted"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <UserMenu />
          ) : (
            <LoginDialog>
              <Button size="sm" className="ml-1 hidden gap-1.5 md:inline-flex">
                <Store className="size-4" />
                {t("nav.becomeSeller")}
              </Button>
            </LoginDialog>
          )}
        </div>
      </div>
    </header>
  );
}
