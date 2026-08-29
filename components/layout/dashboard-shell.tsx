"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, type AppIcon } from "@/components/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo, LogoMark } from "@/components/shared/logo";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { UserMenu } from "@/components/auth/user-menu";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { useT } from "@/components/providers/i18n-provider";

export interface NavSubItem {
  href: string;
  label: string;
  exact?: boolean;
  badge?: number;
}

export interface NavItem {
  href: string;
  label: string;
  icon: AppIcon;
  exact?: boolean;
  onSelect?: () => void;
  badge?: number;
  /** Подвкладки: пункт становится раскрывающимся, href ведёт на первую из них. */
  items?: NavSubItem[];
}

/** Раздел меню: подписанная группа пунктов, отделённая от соседних. */
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface ShellBrand {
  avatar: React.ReactNode;
  title: string;
  subtitle: string;
}

function toGroups(nav: NavItem[] | NavGroup[], fallbackLabel: string): NavGroup[] {
  const grouped = nav.length > 0 && Array.isArray((nav[0] as NavGroup).items);
  return grouped ? (nav as NavGroup[]) : [{ label: fallbackLabel, items: nav as NavItem[] }];
}

function flatten(groups: NavGroup[]): { href: string; exact?: boolean }[] {
  return groups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.items?.length
        ? item.items.map((sub) => ({ href: sub.href, exact: sub.exact }))
        : [{ href: item.href, exact: item.exact }],
    ),
  );
}

export function DashboardShell({
  items,
  sectionLabel,
  brand,
  children,
}: {
  items: NavItem[] | NavGroup[];
  sectionLabel: string;
  brand?: ShellBrand;
  children: React.ReactNode;
}) {
  const { t } = useT();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = toGroups(items, sectionLabel);

  const activeHref = flatten(groups).reduce<string | null>((best, entry) => {
    const matches = entry.exact
      ? pathname === entry.href
      : pathname === entry.href || pathname.startsWith(entry.href + "/");
    if (matches && (best === null || entry.href.length > best.length)) return entry.href;
    return best;
  }, null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="group-data-[side=left]:border-r-0">
        <SidebarHeader className="h-16 justify-center px-4 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-0">
          <Logo className="group-data-[collapsible=icon]:hidden" />
          <LogoMark className="hidden text-primary group-data-[collapsible=icon]:block" />
        </SidebarHeader>

        <SidebarContent>
          {groups.map((group, i) => (
            <Fragment key={group.label ?? i}>
              {i > 0 && <SidebarSeparator className="my-0" />}
              <SidebarGroup className="py-1">
                {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
                <SidebarGroupContent>
                  <NavMenu items={group.items} activeHref={activeHref} />
                </SidebarGroupContent>
              </SidebarGroup>
            </Fragment>
          ))}
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

        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-card md:rounded-tl-2xl">
          <div className="mx-auto w-full px-4 py-8 sm:px-6 lg:px-10">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function NavBadge({ value }: { value: number }) {
  return (
    <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground tabular group-data-[collapsible=icon]:hidden">
      {value > 99 ? "99+" : value}
    </span>
  );
}

function NavMenu({ items, activeHref }: { items: NavItem[]; activeHref: string | null }) {
  return (
    <SidebarMenu className="gap-1">
      {items.map((item) =>
        item.items?.length ? (
          <NavCollapsibleItem key={item.href} item={item} activeHref={activeHref} />
        ) : (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton asChild isActive={item.href === activeHref} tooltip={item.label}>
              {item.onSelect ? (
                <button type="button" onClick={item.onSelect}>
                  <item.icon />
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                  {item.badge ? <NavBadge value={item.badge} /> : null}
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        ),
      )}
    </SidebarMenu>
  );
}

function NavCollapsibleItem({ item, activeHref }: { item: NavItem; activeHref: string | null }) {
  const { state, isMobile } = useSidebar();
  const subItems = item.items ?? [];
  const hasActive = subItems.some((sub) => sub.href === activeHref);
  const [open, setOpen] = useState(hasActive);
  const [wasActive, setWasActive] = useState(hasActive);
  const iconOnly = state === "collapsed" && !isMobile;

  // Раскрываем раздел, когда переходим на его подвкладку.
  if (hasActive !== wasActive) {
    setWasActive(hasActive);
    if (hasActive) setOpen(true);
  }

  // В свёрнутом режиме подвкладки скрыты — ведём сразу на первую из них.
  if (iconOnly) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={hasActive} tooltip={item.label}>
          <Link href={subItems[0]?.href ?? item.href}>
            <item.icon />
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible asChild open={open} onOpenChange={setOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {/* Без tooltip: иначе кнопка обёрнута в Tooltip и asChild не навесит обработчик. */}
          <SidebarMenuButton isActive={hasActive && !open}>
            <item.icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="mt-1">
            {subItems.map((sub) => (
              <SidebarMenuSubItem key={sub.href}>
                <SidebarMenuSubButton asChild isActive={sub.href === activeHref}>
                  <Link href={sub.href}>
                    <span>{sub.label}</span>
                    {sub.badge ? <NavBadge value={sub.badge} /> : null}
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
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
            <span className="truncate text-xs text-muted-foreground">{brand.subtitle}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
