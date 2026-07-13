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
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function SiteHeader() {
  const { t } = useT();
  const { isAuthenticated, isAdmin, isHydrated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-5 sm:px-8 lg:px-10">
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
            </div>
          </SheetContent>
        </Sheet>

        {/* На узких экранах в строку не влезает локап целиком — там только знак. */}
        <Logo showText={false} className="sm:hidden" />
        <Logo className="hidden sm:inline-flex" />

        <div className="mx-2 hidden max-w-xl flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <LanguageSwitch />
          <AnimatedThemeToggler
            aria-label={t("common.theme")}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
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
