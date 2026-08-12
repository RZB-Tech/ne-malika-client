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
  Monitor,
  Package,
  ShoppingBasket,
  Smartphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/shared/logo";
import { CategoryIcon } from "@/components/shared/category-icon";
import { SearchBar, SearchBarSkeleton } from "@/components/shared/search-bar";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
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
  icon: LucideIcon;
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
  const [marketCity, ...marketPlaceParts] = t("common.market").split(" · ");
  const marketPlace = marketPlaceParts.join(" · ");

  return (
    <header
      data-compact={isCompact}
      className="sticky top-0 z-50 mx-auto w-full max-w-[1600px] rounded-b-3xl bg-card [overflow-anchor:none]"
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-[1600px] items-center gap-2 px-5 transition-[height] duration-200 ease-out sm:gap-3 sm:px-8 lg:px-10",
          isCompact ? "h-16" : "h-17",
        )}
      >
        <Logo showText={false} className="md:hidden" />
        <Logo className="mr-1 hidden md:inline-flex" />

        <CatalogMenu />

        {/* На телефоне поиск занимает отдельную строку ниже: рядом с бургером,
            знаком и входом ему остаётся сотня точек, и от поля видно одну
            букву. Строка поиска читает адрес страницы, а он известен только в
            браузере, поэтому граница Suspense — без неё весь сайт, включая
            статические страницы, пришлось бы рендерить на клиенте. */}
        <div className="hidden min-w-0 flex-1 md:block">
          <Suspense fallback={<SearchBarSkeleton appearance="marketplace" />}>
            <SearchBar appearance="marketplace" />
          </Suspense>
        </div>

        {/* Действия покупателя: значок и подпись под ним. Подписи важнее
            компактности — иконка весов без слова «Сравнение» не читается
            никем, кроме того, кто её рисовал. */}
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

          <FavoritesAction />
          <CartAction />
        </nav>
      </div>

      {/* Поиск во всю ширину — телефонная строка. Прячется вместе с шапкой при
          прокрутке вниз, как и всё остальное: место на экране дороже. */}
      <div className="px-5 pb-3 md:hidden">
        <Suspense fallback={<SearchBarSkeleton appearance="marketplace" />}>
          <SearchBar appearance="marketplace" />
        </Suspense>
      </div>

      {/* Вторая строка: на телефоне разделы, язык и тема живут в бургере,
          поэтому там её просто нет. */}
      <div
        aria-hidden={isCompact}
        className={cn(
          "hidden overflow-hidden transition-[height,opacity] duration-200 ease-out lg:block",
          isCompact
            ? "invisible h-0 pointer-events-none opacity-0"
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
            <span className="hidden items-center text-xs xl:flex">
              <span className="text-muted-foreground">{marketCity} ·</span>
              <span className="ml-1 font-semibold text-primary">
                {marketPlace}
              </span>
            </span>
            <LanguageSwitch />
          </div>
        </div>
      </div>

      <div
        aria-hidden={isCompact}
        className={cn(
          "relative mx-auto w-full max-w-[1600px] overflow-hidden rounded-b-3xl bg-primary transition-[height,opacity] duration-200 ease-out",
          isCompact
            ? "invisible h-0 pointer-events-none opacity-0"
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
      {/* Подпись не переносится и не жмётся: «Сравнение» в две строки поднимает
          высоту всей шапки. На узком экране подписи нет вовсе — там и места
          нет, и рядом стоит бургер с теми же пунктами словами. */}
      <span className="hidden truncate text-[11px] leading-none whitespace-nowrap sm:block">
        {label}
      </span>
    </>
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

function CartAction() {
  const { t } = useT();
  const { items } = useCompare();

  return (
    <Button
      asChild
      variant="ghost"
      size="lg"
      className={cn(ACTION_CLASS, "hidden md:flex")}
    >
      <Link href="/compare" title={t("nav.cart")}>
        <ActionBody
          icon={ShoppingBasket}
          label={t("nav.cart")}
          count={items.length}
        />
      </Link>
    </Button>
  );
}
