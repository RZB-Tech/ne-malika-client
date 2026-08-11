"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Heart, History, Scale, Store, UserRound } from "lucide-react";
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
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

/**
 * Сколько разделов выносим во вторую строку. Больше семи не помещается даже на
 * широком экране, а перенос на две строки ломает высоту шапки — остальные
 * разделы открывает кнопка «Каталог».
 */
const QUICK_CATEGORIES = 7;

/** Общий вид действия в шапке: значок сверху, подпись под ним. */
const ACTION_CLASS =
  "flex h-13 w-14 shrink-0 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40";

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

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-2 px-4 sm:gap-3 sm:px-8 lg:px-10">
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
        <nav className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          {isHydrated &&
            (isAuthenticated ? (
              <Link href="/account" className={ACTION_CLASS} title={t("nav.history")}>
                <ActionBody icon={History} label={t("nav.history")} />
              </Link>
            ) : (
              <LoginDialog>
                <button type="button" className={ACTION_CLASS} title={t("nav.login")}>
                  <ActionBody icon={UserRound} label={t("nav.login")} />
                </button>
              </LoginDialog>
            ))}

          <FavoritesAction />
          <CompareAction />

          {!isHydrated ? (
            // Заглушка до чтения localStorage: иначе гость на мгновение видит
            // себя вошедшим и наоборот.
            <div
              className="ml-1 size-8 shrink-0 rounded-full bg-muted"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <div className="ml-1">
              <UserMenu />
            </div>
          ) : (
            <LoginDialog>
              <Button size="sm" className="ml-1 hidden gap-1.5 lg:inline-flex">
                <Store className="size-4" />
                {t("nav.becomeSeller")}
              </Button>
            </LoginDialog>
          )}
        </nav>
      </div>

      {/* Вторая строка: на телефоне разделы, язык и тема живут в бургере,
          поэтому там её просто нет. */}
      <div className="hidden border-t border-border/70 lg:block">
        <div className="mx-auto flex h-10 max-w-[1600px] items-center gap-1 px-4 sm:px-8 lg:px-10">
          {roots.slice(0, QUICK_CATEGORIES).map((root) => (
            <Link
              key={root.id}
              href={`/?category=${root.slug}`}
              className="flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CategoryIcon name={root.icon} className="size-4" />
              {root.name[locale]}
            </Link>
          ))}

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <span className="hidden text-xs text-muted-foreground xl:inline">
              {t("common.market")}
            </span>
            <LanguageSwitch />
            <AnimatedThemeToggler
              aria-label={t("common.theme")}
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-4"
            />
          </div>
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
}: {
  icon: typeof Heart;
  label: string;
  count?: number;
}) {
  return (
    <>
      <span className="relative">
        <Icon className="size-[1.35rem]" />
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1 -right-1.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="hidden text-[11px] leading-none sm:block">{label}</span>
    </>
  );
}

/** Счётчики лежат в localStorage, поэтому у каждого действия свой хук. */
function FavoritesAction() {
  const { t } = useT();
  const { count } = useFavorites();

  return (
    <Link
      href="/account?tab=favorites"
      className={ACTION_CLASS}
      title={t("account.tabs.favorites")}
    >
      <ActionBody
        icon={Heart}
        label={t("account.tabs.favorites")}
        count={count}
      />
    </Link>
  );
}

function CompareAction() {
  const { t } = useT();
  const { items } = useCompare();

  return (
    <Link href="/compare" className={ACTION_CLASS} title={t("nav.compare")}>
      <ActionBody icon={Scale} label={t("nav.compare")} count={items.length} />
    </Link>
  );
}
