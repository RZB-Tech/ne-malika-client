"use client";

import { useState } from "react";
import Link from "next/link";
import { History, Menu, Scale, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { LoginDialog } from "@/components/auth/login-dialog";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";

/**
 * Бургер в шапке: слева выезжает навигация — личный кабинет, сравнение, вход
 * в кабинет продавца, язык и тема. Панель фильтров отсюда убрана вместе с
 * кнопкой «Фильтры» над сеткой каталога.
 */
export function HeaderMenu() {
  const { t } = useT();
  const { isAuthenticated, isAdmin, isSeller } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative shrink-0 hover:bg-white/15 hover:text-primary-foreground lg:hidden"
          aria-label={t("common.menu")}
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-left">
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <SheetFooter className="gap-3 border-t border-border">
          <div className="grid grid-cols-2 gap-2">
            <Button asChild variant="outline" className="gap-2">
              <Link href="/account" onClick={() => setOpen(false)}>
                <History className="size-4" />
                {t("nav.account")}
              </Link>
            </Button>
            <Button asChild variant="outline" className="gap-2">
              <Link href="/compare" onClick={() => setOpen(false)}>
                <Scale className="size-4" />
                {t("compare.open")}
              </Link>
            </Button>
          </div>

          {isAuthenticated ? (
            <Button asChild className="w-full gap-2">
              <Link
                href={isAdmin ? "/admin" : "/seller"}
                onClick={() => setOpen(false)}
              >
                <Store className="size-4" />
                {isAdmin
                  ? t("nav.admin")
                  : isSeller
                    ? t("nav.sellerCabinet")
                    : t("nav.becomeSeller")}
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

          <div className="flex items-center justify-between sm:hidden">
            <LanguageSwitch />
            <AnimatedThemeToggler
              aria-label={t("common.theme")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
            />
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

