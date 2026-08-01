"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowLeft, type LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  exact?: boolean;
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

  // Прокручивается панель, а не окно, поэтому штатное восстановление скролла
  // Next.js её не касается: без этого новый раздел открывался бы промотанным
  // туда же, где остановились в предыдущем.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <SidebarProvider>
      <Sidebar
        collapsible="icon"
        // Вариант в селекторе тот же, что в исходном классе, — иначе twMerge
        // оставит оба, и border-r победит по специфичности.
        className="group-data-[side=left]:border-r-0"
      >
        <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <LogoMark className="hidden text-primary group-data-[collapsible=icon]:block" />
        </SidebarHeader>

        {/*
          Без собственных отступов: у SidebarGroup и SidebarFooter уже есть
          свои p-2. Лишний px-2 здесь сдвигал иконки меню на 8px относительно
          плашки внизу — в свёрнутом виде это сразу бросалось в глаза.
        */}
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

        {/* Полоса у края: клик или перетаскивание сворачивает меню. */}
        <SidebarRail />
      </Sidebar>

      {/*
        Прокрутка живёт внутри белой панели, а не на странице целиком: иначе
        скруглённый угол уехал бы вверх при первом же скролле.
      */}
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
          <div className="mx-auto w-full px-4 py-8 sm:px-6">
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
            <Link href={item.href}>
              <item.icon />
              <span>{item.label}</span>
            </Link>
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
