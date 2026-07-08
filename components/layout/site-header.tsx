"use client";

import { useState } from "react";
import { Menu, Store, UserPlus } from "lucide-react";
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
import { useT } from "@/components/providers/i18n-provider";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function SiteHeader() {
  const { t } = useT();
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
              <div className="grid gap-2">
                <LoginDialog>
                  <Button className="gap-2">
                    <UserPlus className="size-4" /> {t("nav.becomeSeller")}
                  </Button>
                </LoginDialog>
                <LoginDialog>
                  <Button variant="outline">{t("nav.login")}</Button>
                </LoginDialog>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Logo />

        <div className="mx-2 hidden max-w-xl flex-1 md:block">
          <SearchBar withAiMode />
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <div className="hidden sm:block">
            <LanguageSwitch />
          </div>
          <AnimatedThemeToggler
            aria-label={t("common.theme")}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
          />
          <LoginDialog>
            <Button
              variant="ghost"
              size="sm"
              className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
            >
              {t("nav.login")}
            </Button>
          </LoginDialog>
          <LoginDialog>
            <Button size="sm" className="ml-1 hidden gap-1.5 sm:inline-flex">
              <Store className="size-4" />
              <span className="hidden lg:inline">{t("nav.becomeSeller")}</span>
              <span className="lg:hidden">{t("nav.sellerCabinet")}</span>
            </Button>
          </LoginDialog>
        </div>
      </div>
    </header>
  );
}
