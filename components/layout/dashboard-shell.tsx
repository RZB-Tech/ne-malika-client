"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Menu, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Logo } from "@/components/shared/logo";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import {AnimatedThemeToggler} from "@/components/ui/animated-theme-toggler";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  // Highlight only the most specific matching item, so e.g. /seller/products/new
  // activates "Add product" and not the parent "My products".
  const activeHref = items.reduce<string | null>((best, item) => {
    const matches = item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
    if (matches && (best === null || item.href.length > best.length)) return item.href;
    return best;
  }, null);

  return (
    <nav className="grid gap-1">
      {items.map((item) => {
        const active = item.href === activeHref;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardShell({
  items,
  sectionLabel,
  brandBadge,
  children,
}: {
  items: NavItem[];
  sectionLabel: string;
  brandBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  const sidebarInner = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center border-b border-sidebar-border px-5">
        <Logo />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {sectionLabel}
        </div>
        <NavLinks items={items} onNavigate={onNavigate} />
        {brandBadge && <div className="mt-6">{brandBadge}</div>}
      </div>
      <div className="border-t border-sidebar-border p-4">
        <Button asChild variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
          <Link href="/" onClick={onNavigate}>
            <ArrowLeft className="size-4" />
            {t("seller.nav.backToSite")}
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/20">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">
        {sidebarInner()}
      </aside>

      <div className="lg:pl-64">
        {/* top bar */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur-md sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">{sectionLabel}</SheetTitle>
              {sidebarInner(() => setOpen(false))}
            </SheetContent>
          </Sheet>

          <span className="font-heading text-sm font-semibold text-muted-foreground lg:hidden">
            {sectionLabel}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitch />
            <AnimatedThemeToggler
                aria-label={t("common.theme")}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
            />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
