"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense, useEffect, useState } from "react";
import {
  Cpu,
  HardDrive,
  Heart,
  Keyboard,
  Laptop,
  MessageSquare,
  Monitor,
  Package,
  Scale,
  Smartphone,
  UserRound,
  type AppIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { Logo } from "@/components/shared/logo";
import { CategoryIcon } from "@/components/shared/category-icon";
import { SearchBar, SearchBarSkeleton } from "@/components/shared/search-bar";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { ChatDrawer, useBuyerUnread } from "@/components/chat/chat-drawer";
import { CatalogMenu } from "./catalog-menu";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useCategories } from "@/lib/api/categories";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { useCompare } from "@/lib/compare/use-compare";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Сколько разделов выносим во вторую строку. Больше семи не помещается даже на
 * широком экране, а перенос на две строки ломает высоту шапки — остальные
 * разделы открывает кнопка «Каталог».
 */
const QUICK_CATEGORIES = 6;

const FALLBACK_QUICK_CATEGORIES: Array<{
  query: string;
  icon: AppIcon;
  name: Record<Locale, string>;
}> = [
  {
    query: "электроника",
    icon: Cpu,
    name: {
      ru: "Электроника",
      "uz-Latn": "Elektronika",
      "uz-Cyrl": "Электроника",
    },
  },
  {
    query: "ноутбук",
    icon: Laptop,
    name: {
      ru: "Ноутбуки",
      "uz-Latn": "Noutbuklar",
      "uz-Cyrl": "Ноутбуклар",
    },
  },
  {
    query: "компьютер",
    icon: HardDrive,
    name: {
      ru: "Компьютеры",
      "uz-Latn": "Kompyuterlar",
      "uz-Cyrl": "Компьютерлар",
    },
  },
  {
    query: "смартфон",
    icon: Smartphone,
    name: {
      ru: "Смартфоны",
      "uz-Latn": "Smartfonlar",
      "uz-Cyrl": "Смартфонлар",
    },
  },
  {
    query: "монитор",
    icon: Monitor,
    name: {
      ru: "Мониторы",
      "uz-Latn": "Monitorlar",
      "uz-Cyrl": "Мониторлар",
    },
  },
  {
    query: "периферия",
    icon: Keyboard,
    name: {
      ru: "Периферия",
      "uz-Latn": "Periferiya",
      "uz-Cyrl": "Периферия",
    },
  },
];

/** Общий вид действия в шапке: значок сверху, подпись под ним. */
const ACTION_CLASS =
  "flex h-13 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40";

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

/**
 * Шапка витрины по раскладке крупных маркетплейсов: светлая, в две строки.
 *
 * Первая строка — знак, «Каталог», поиск во всю оставшуюся ширину и действия
 * покупателя. Вторая — быстрые разделы каталога, язык и тема.
 *
 * Фон светлый, а не фирменный синий, как было раньше: на синем поле и строку
 * поиска, и кнопку каталога приходилось осветлять до белого, и они переставали
 * отличаться друг от друга. Синим осталось то, что должно звать нажать, —
 * кнопка каталога и кнопка поиска.
 */
export function SiteHeader() {
  const { t, locale } = useT();
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { roots } = useCategories();
  const [isCompact, setIsCompact] = useState(false);
  const username = user?.telegramUsername as string | null | undefined;
  const photo = user?.telegramPhoto as string | null | undefined;
  const accountLabel = username
    ? `@${username}`
    : user?.fullname.trim().split(/\s+/)[0] || t("nav.account");

  useEffect(() => {
    let animationFrame = 0;

    const updateHeader = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        setIsCompact((current) => {
          const next = current ? window.scrollY > 24 : window.scrollY > 160;
          return next === current ? current : next;
        });
      });
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateHeader);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  return (
    <header
      data-compact={isCompact}
      className="sticky top-0 z-50 mx-auto w-full max-w-[1600px] bg-card [overflow-anchor:none] md:rounded-b-3xl"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1600px] items-center gap-2 px-5 transition-[height] duration-200 ease-out sm:gap-3 sm:px-8 lg:px-10",
          isCompact ? "h-16" : "h-17",
        )}
      >
        <Logo showText={false} className="md:hidden" />
        <Logo className="mr-1 hidden md:inline-flex" />

        <div className="min-w-0 flex-1 md:hidden">
          <Suspense fallback={<SearchBarSkeleton appearance="marketplace" />}>
            <SearchBar appearance="marketplace" />
          </Suspense>
        </div>

        <CatalogMenu />

        <div className="hidden min-w-0 flex-1 md:block">
          <Suspense fallback={<SearchBarSkeleton appearance="marketplace" />}>
            <SearchBar appearance="marketplace" />
          </Suspense>
        </div>

        <nav
          aria-label={t("common.actions")}
          className="flex shrink-0 items-center gap-0.5 sm:gap-1"
        >
          {!isHydrated || !isAuthenticated ? (
            <LoginDialog>
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className={cn(ACTION_CLASS, "hidden text-foreground md:flex")}
                title={t("nav.login")}
              >
                <ActionBody
                  icon={UserRound}
                  label={t("nav.login")}
                  attention
                />
              </Button>
            </LoginDialog>
          ) : (
            <UserMenu
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  className={cn(ACTION_CLASS, "hidden text-foreground md:flex")}
                  title={accountLabel}
                >
                  <Avatar size="sm">
                    {photo && user ? (
                      <AvatarImage src={photo} alt={user.fullname} />
                    ) : null}
                    <AvatarFallback>
                      {user ? initials(user.fullname) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-16 truncate text-[11px] leading-none">
                    {accountLabel}
                  </span>
                </Button>
              }
            />
          )}

          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn(ACTION_CLASS, "hidden md:flex")}
          >
            <Link href="/account?tab=history" title={t("nav.orders")}>
              <ActionBody icon={Package} label={t("nav.orders")} />
            </Link>
          </Button>

          <MessagesAction />
          <FavoritesAction />
          <CompareAction />

          {/**
           * Язык и тема для телефона. На широком экране они стоят во второй
           * строке шапки, но её показывают только с `lg` — на телефоне, где
           * второй строки нет вовсе, переключиться было нечем.
           *
           * Только до `md`: с планшета в этот же ряд встают пять действий
           * покупателя, и ещё две кнопки отобрали бы у строки поиска последнее
           * место.
           */}
          <div className="flex shrink-0 items-center gap-0.5 md:hidden">
            <LanguageSwitch className="h-9 gap-1 px-1.5" />
            <AnimatedThemeToggler
              aria-label={t("common.theme")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[1.15rem]"
            />
          </div>
        </nav>
      </div>

      <div
        aria-hidden={isCompact}
        className={cn(
          "hidden overflow-hidden transition-[height,opacity] duration-300 ease-in-out motion-reduce:transition-none lg:block",
          isCompact
            ? "h-0 pointer-events-none opacity-0"
            : "h-10 opacity-100",
        )}
      >
        <div className="mx-auto flex h-10 w-full max-w-[1600px] items-center px-5 sm:px-8 lg:px-10">
          <nav className="no-scrollbar flex min-w-0 items-center gap-1 overflow-x-auto">
            {roots.length > 0
              ? roots.slice(0, QUICK_CATEGORIES).map((root) => (
                  <Link
                    key={root.id}
                    href={`/?category=${root.slug}`}
                    className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <CategoryIcon name={root.icon} className="size-4" />
                    {root.name[locale]}
                  </Link>
                ))
              : FALLBACK_QUICK_CATEGORIES.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.query}
                      href={`/?q=${encodeURIComponent(item.query)}`}
                      className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Icon className="size-4" />
                      {item.name[locale]}
                    </Link>
                  );
                })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1 pl-3">
            <LanguageSwitch />
            <AnimatedThemeToggler
              aria-label={t("common.theme")}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-[1.15rem]"
            />
          </div>
        </div>
      </div>

      <div
        aria-hidden={isCompact}
        className={cn(
          "relative mx-auto hidden w-full max-w-[1600px] overflow-hidden rounded-b-3xl bg-primary transition-[height,opacity] duration-300 ease-in-out motion-reduce:transition-none md:block",
          isCompact
            ? "h-0 pointer-events-none opacity-0"
            : "h-18 opacity-100",
        )}
      >
        <Image
          src="/header-gaming-banner-v2.png"
          alt=""
          fill
          priority
          unoptimized
          sizes="(max-width: 1600px) 100vw, 1600px"
          className="object-cover object-left"
        />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-8">
          <p className="truncate text-center font-heading text-xl font-bold tracking-tight text-white [text-shadow:0_2px_10px_rgb(0_0_0_/_45%)] lg:text-2xl">
            {t("common.bannerTagline")}
          </p>
        </div>
      </div>
    </header>
  );
}

/**
 * Содержимое действия. Отдельно от обёртки, потому что обёртки разные: ссылка
 * ведёт на страницу, а вход открывает окно — и `LoginDialog` вешает обработчик
 * на своего ребёнка, которым должен быть настоящий элемент, а не компонент.
 */
function ActionBody({
  icon: Icon,
  label,
  count,
  attention = false,
}: {
  icon: typeof Heart;
  label: string;
  count?: number;
  attention?: boolean;
}) {
  return (
    <>
      <span className="relative">
        <Icon strokeWidth={2.1} />
        {attention && (
          <span className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive ring-2 ring-background" />
        )}
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="hidden truncate text-[11px] leading-none whitespace-nowrap sm:block">
        {label}
      </span>
    </>
  );
}

/**
 * Переписка с продавцами. В отличие от соседей ведёт не на страницу, а
 * открывает панель справа: отвечают между делом, не отрываясь от каталога.
 */
function MessagesAction() {
  const { t } = useT();
  const unread = useBuyerUnread();

  return (
    <ChatDrawer>
      <Button
        variant="ghost"
        size="lg"
        title={t("nav.messages")}
        className={cn(ACTION_CLASS, "hidden md:flex")}
      >
        <ActionBody
          icon={MessageSquare}
          label={t("nav.messages")}
          count={unread}
        />
      </Button>
    </ChatDrawer>
  );
}

/** Счётчики лежат в localStorage, поэтому у каждого действия свой хук. */
function FavoritesAction() {
  const { t } = useT();
  const { count } = useFavorites();

  return (
    <Button
      asChild
      variant="ghost"
      size="lg"
      className={cn(ACTION_CLASS, "hidden md:flex")}
    >
      <Link
        href="/account?tab=favorites"
        title={t("account.tabs.favorites")}
      >
        <ActionBody
          icon={Heart}
          label={t("account.tabs.favorites")}
          count={count}
        />
      </Link>
    </Button>
  );
}

function CompareAction() {
  const { t } = useT();
  const { items } = useCompare();

  return (
    <Button
      asChild
      variant="ghost"
      size="lg"
      className={cn(ACTION_CLASS, "hidden md:flex")}
    >
      <Link href="/compare" title={t("nav.compare")}>
        <ActionBody
          icon={Scale}
          label={t("nav.compare")}
          count={items.length}
        />
      </Link>
    </Button>
  );
}
