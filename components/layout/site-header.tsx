"use client";

import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import {
  ArrowRight,
  Cpu,
  HardDrive,
  Heart,
  History,
  Keyboard,
  Laptop,
  Monitor,
  Scale,
  Smartphone,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { CategoryIcon } from "@/components/shared/category-icon";
import { SearchBar, SearchBarSkeleton } from "@/components/shared/search-bar";
import { LanguageSwitch } from "@/components/shared/language-switch";
import { LoginDialog } from "@/components/auth/login-dialog";
import { UserMenu } from "@/components/auth/user-menu";
import { HeaderMenu } from "./header-menu";
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
  const { isAuthenticated, isHydrated } = useAuth();
  const { roots } = useCategories();
  const [marketCity, ...marketPlaceParts] = t("common.market").split(" · ");
  const marketPlace = marketPlaceParts.join(" · ");

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="flex h-17 w-full items-center gap-2 px-5 sm:gap-3 lg:px-6">
        <HeaderMenu />

        <Logo showText={false} className="md:hidden" />
        <Logo className="mr-1 hidden md:inline-flex" />

        <CatalogMenu />

        <div className="min-w-0 flex-1">
          {/* Строка поиска читает адрес страницы, а он известен только в
              браузере. Без границы Suspense весь сайт, включая статические
              страницы, пришлось бы рендерить на клиенте. */}
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
            <div className="hidden md:block">
              <UserMenu />
            </div>
          )}

          <Button
            asChild
            variant="ghost"
            size="lg"
            className={cn(ACTION_CLASS, "hidden md:flex")}
          >
            <Link href="/account?tab=history" title={t("nav.history")}>
              <ActionBody icon={History} label={t("nav.history")} />
            </Link>
          </Button>

          <FavoritesAction />
          <CompareAction />
        </nav>
      </div>

      {/* Вторая строка: на телефоне разделы, язык и тема живут в бургере,
          поэтому там её просто нет. */}
      <div className="hidden border-t border-border/70 lg:block">
        <div className="flex h-10 w-full items-center px-5 lg:px-6">
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

      {/* Третий уровень повторяет композицию референса: изображение остаётся
          чистым фоном, а текст и CTA рендерятся поверх него и не теряют
          резкость на Retina-экранах. */}
      <section
        aria-label={t("home.promoTitle")}
        className="relative h-18 overflow-hidden rounded-b-3xl bg-primary"
      >
        <Image
          src="/header-sale-banner-user.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 mx-auto flex h-full max-w-[1020px] items-center justify-center px-4 lg:justify-start">
          <div className="hidden w-60 shrink-0 lg:block" aria-hidden />

          <div className="flex items-center gap-3 sm:gap-6">
            <h2 className="font-heading text-sm font-bold whitespace-nowrap text-white drop-shadow-sm sm:text-xl">
              {t("home.promoTitle")}
            </h2>
            <Button
              asChild
              variant="secondary"
              size="xs"
              className="rounded-full bg-foreground text-background shadow-sm hover:bg-foreground/85"
            >
              <Link href="/?sort=latest">
                {t("home.promoCta")}
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <div
            className="ml-auto hidden items-center text-white drop-shadow-sm lg:flex"
            aria-hidden
          >
            <span className="-rotate-6 rounded-lg bg-warning px-2 py-1 font-heading text-2xl font-black italic shadow-md">
              NM
            </span>
            <span className="-ml-1 font-heading text-lg leading-[0.82] font-black">
              ТЕХНО
              <br />
              СЕЗОН
            </span>
          </div>
        </div>
      </section>
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
        <Icon />
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
      className={cn(ACTION_CLASS, "size-9 px-0 sm:h-13 sm:w-16")}
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
