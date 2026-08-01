"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { History, Menu, SlidersHorizontal, Store } from "lucide-react";
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
import { FilterPanel } from "@/components/catalog/filter-panel";
import { useCatalogFilters } from "@/components/catalog/use-catalog-filters";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { onOpenHeaderMenu } from "./header-menu-bus";

/**
 * Бургер в шапке: слева выезжает панель с фильтрами каталога и навигацией.
 * Доступна на любой странице — фильтр, выбранный с карточки товара, уводит на
 * витрину с уже применённым запросом.
 */
export function HeaderMenu() {
  const { t } = useT();
  const { isAuthenticated, isAdmin, isSeller } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => onOpenHeaderMenu(() => setOpen(true)), []);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative shrink-0 lg:hidden"
          aria-label={t("common.menu")}
        >
          <Menu className="size-5" />
          <Suspense fallback={null}>
            <ActiveFilterBadge />
          </Suspense>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="text-left">
            <Logo />
          </SheetTitle>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
          <Suspense fallback={null}>
            <MenuFilters />
          </Suspense>
        </div>

        <SheetFooter className="gap-3 border-t border-border">
          {/* Виден и анониму: история просмотров копится без входа. */}
          <Button asChild variant="outline" className="w-full gap-2">
            <Link href="/account" onClick={() => setOpen(false)}>
              <History className="size-4" />
              {t("nav.account")}
            </Link>
          </Button>

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

function MenuFilters() {
  const { t } = useT();
  const { sort, setSort, priceDraft, updatePrice, resetFilters, activeCount } =
    useCatalogFilters();

  return (
    <>
      <div className="flex h-12 items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal className="size-4 text-muted-foreground" />
          {t("catalog.filters")}
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-primary hover:underline"
          >
            {t("common.resetAll")}
          </button>
        )}
      </div>

      <FilterPanel
        defaultOpen
        filters={priceDraft}
        setFilters={updatePrice}
        sort={sort}
        setSort={setSort}
      />
    </>
  );
}

/** Счётчик применённых фильтров поверх бургера. */
function ActiveFilterBadge() {
  const { activeCount } = useCatalogFilters();
  if (activeCount === 0) return null;

  return (
    <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground tabular">
      {activeCount}
    </span>
  );
}
