"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronDown, LayoutGrid, Menu, Store, Tag, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Logo } from "@/components/shared/logo";
import { SearchBar } from "@/components/shared/search-bar";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useT } from "@/components/providers/i18n-provider";
import { categories, categoryProductCount } from "@/lib/data";

const quickCats = [
  "laptops",
  "videocards",
  "cpu",
  "monitors",
  "ssd",
  "keyboards",
  "headphones",
];

function CategoryMega({ onNavigate }: { onNavigate?: () => void }) {
  const { locale } = useT();
  return (
    <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/catalog?category=${c.slug}`}
          onClick={onNavigate}
          className="group flex items-center gap-3 rounded-lg px-2.5 py-2 transition-colors hover:bg-muted"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
            <CategoryIcon name={c.icon} className="size-[18px]" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium leading-tight text-foreground">
              {c.name[locale]}
            </span>
            <span className="text-xs text-muted-foreground tabular">
              {categoryProductCount(c.slug)}
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function SiteHeader() {
  const { t, locale } = useT();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
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
              <div className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("nav.categories")}
              </div>
              <div className="grid gap-0.5">
                {categories.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/catalog?category=${c.slug}`}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  >
                    <CategoryIcon name={c.icon} className="size-4 text-muted-foreground" />
                    {c.name[locale]}
                  </Link>
                ))}
              </div>
              <div className="mt-5 grid gap-2 border-t border-border pt-5">
                <Button asChild>
                  <Link href="/seller" onClick={() => setMobileOpen(false)}>
                    <UserPlus className="size-4" /> {t("nav.becomeSeller")}
                  </Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login" onClick={() => setMobileOpen(false)}>
                    {t("nav.login")}
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Logo />

        <div className="mx-2 hidden max-w-xl flex-1 md:block">
          <SearchBar />
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <div className="hidden sm:block">
            <LanguageSwitch />
          </div>
          <ThemeToggle />
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hidden text-muted-foreground hover:text-foreground lg:inline-flex"
          >
            <Link href="/login">{t("nav.login")}</Link>
          </Button>
          <Button asChild size="sm" className="ml-1 hidden gap-1.5 sm:inline-flex">
            <Link href="/seller">
              <Store className="size-4" />
              <span className="hidden lg:inline">{t("nav.becomeSeller")}</span>
              <span className="lg:hidden">{t("nav.sellerCabinet")}</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* secondary nav */}
      <div className="hidden border-t border-border/70 lg:block">
        <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-4 sm:px-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 font-medium data-[state=open]:bg-muted">
                <LayoutGrid className="size-4" />
                {t("nav.catalog")}
                <ChevronDown className="size-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[min(46rem,90vw)] p-3">
              <CategoryMega />
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1 h-4 w-px bg-border" />

          <nav className="flex items-center gap-0.5 overflow-x-auto no-scrollbar">
            {quickCats.map((slug) => {
              const c = categories.find((x) => x.slug === slug)!;
              return (
                <Button key={slug} asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <Link href={`/catalog?category=${slug}`}>{c.name[locale]}</Link>
                </Button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-0.5">
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Link href="/catalog?promo=1">
                <Tag className="size-4 text-destructive" />
                {t("nav.promos")}
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
              <Link href="/admin">{t("nav.admin")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
