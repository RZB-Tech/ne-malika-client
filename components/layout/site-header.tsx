"use client";

import Link from "next/link";
import { History, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { SearchBar } from "@/components/shared/search-bar";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { HeaderMenu } from "./header-menu";
import { CatalogMenu } from "./catalog-menu";
import { FavoritesLink } from "./favorites-link";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function SiteHeader() {
  const { t } = useT();
  const { isAuthenticated, isHydrated } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      {/* Одна строка на все экраны: бургер — знак — поиск во всю оставшуюся
          ширину — действия. Поиск здесь главный элемент, поэтому он забирает
          всё свободное место, а логотип ужимается до знака. */}
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:gap-3 sm:px-8 lg:px-10">
        <HeaderMenu />

        <Logo showText={false} className="lg:hidden" />
        <Logo className="hidden lg:inline-flex" />

        <CatalogMenu />

        <div className="min-w-0 flex-1">
          <SearchBar />
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {/* Избранное есть и у анонима, поэтому сердце видно всегда. Ждём
              гидратации: до неё счётчик из localStorage ещё не прочитан. */}
          {isHydrated && <FavoritesLink />}

          <div className="hidden sm:contents">
            <LanguageSwitch />
            <AnimatedThemeToggler
              aria-label={t("common.theme")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
            />
          </div>

          {/* Гостю кабинет иначе недоступен: бургер с этой ссылкой прячется на
              широких экранах, а меню аватара есть только у вошедших. */}
          {isHydrated && !isAuthenticated && (
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              aria-label={t("nav.account")}
              title={t("nav.account")}
            >
              <Link href="/account">
                <History className="size-[1.15rem]" />
              </Link>
            </Button>
          )}

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
              {/* На узких экранах кнопка не влезает рядом с поиском — там вход
                  лежит в шторке бургера. */}
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
