"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowLeft, type AppIcon } from "@/components/icons";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Logo, LogoMark } from "@/components/shared/logo";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { UserMenu } from "@/components/auth/user-menu";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useT } from "@/components/providers/i18n-provider";

export interface NavItem {
  href: string;
  label: string;
  icon: AppIcon;
  exact?: boolean;
  /** Если задан — пункт открывает окно вместо перехода по href. */
  onSelect?: () => void;
  /** Непрочитанное рядом с подписью. Ноль не показываем. */
  badge?: number;
}

/** Плашка владельца раздела. В свёрнутом меню от неё остаётся только аватар. */
export interface ShellBrand {
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
}

/**
 * Оболочка кабинетов продавца и администратора: боковое меню + верхняя панель.
 *
 * Панель и меню намеренно без разделительных линий и на одном фоне (`bg-sidebar`)
 * — вместе они читаются как единая Г-образная рамка вокруг контента, а не как
 * два состыкованных блока.
 */
export function DashboardShell({
  items,
  sectionLabel,
  brand,
  children,
}: {
  items: NavItem[];
  sectionLabel: string;
  brand?: ShellBrand;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        className="group-data-[side=left]:border-r-0"
      >
        <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <LogoMark className="hidden text-primary group-data-[collapsible=icon]:block" />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{sectionLabel}</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu items={items} />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="gap-3 pb-4">
          {brand && <BrandBadge brand={brand} />}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                tooltip={t("seller.nav.backToSite")}
                className="text-muted-foreground"
              >
                <Link href="/">
                  <ArrowLeft />
                  <span>{t("seller.nav.backToSite")}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset className="h-svh overflow-hidden bg-sidebar">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4 sm:px-6">
          <SidebarTrigger className="-ml-1.5 text-muted-foreground" />
          <span className="truncate font-heading text-sm font-semibold text-muted-foreground">
            {sectionLabel}
          </span>

          <div className="ml-auto flex items-center gap-1">
            <LanguageSwitch />
            <AnimatedThemeToggler
              aria-label={t("common.theme")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 dark:hover:bg-muted/50 [&_svg]:size-[1.15rem]"
            />
            <UserMenu />
          </div>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-card md:rounded-tl-2xl"
        >
          <div className="mx-auto w-full max-w-site px-4 py-8 sm:px-6 lg:px-10">
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NavMenu({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  const activeHref = items.reduce<string | null>((best, item) => {
    const matches = item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + "/");
    if (matches && (best === null || item.href.length > best.length)) {
      return item.href;
    }
    return best;
  }, null);

  return (
    <SidebarMenu className="gap-1">
      {items.map((item) => (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            isActive={item.href === activeHref}
            tooltip={item.label}
          >
            {item.onSelect ? (
              <button type="button" onClick={item.onSelect}>
                <item.icon />
                <span>{item.label}</span>
              </button>
            ) : (
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular group-data-[collapsible=icon]:hidden">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                ) : null}
              </Link>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

function BrandBadge({ brand }: { brand: ShellBrand }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          tooltip={`${brand.title} — ${brand.subtitle}`}
          className="cursor-default hover:bg-transparent active:bg-transparent"
        >
          {brand.avatar}
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">{brand.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {brand.subtitle}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
