"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Search, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryIcon } from "@/components/shared/category-icon";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";
import { useCategories } from "@/lib/api/categories";

/** Каталог — единственная страница, где запрос что-то меняет прямо на глазах. */
const CATALOG_PATH = "/";

/** Пауза перед запросом: примерно столько длится провал между словами. */
const DEBOUNCE_MS = 300;

/**
 * Вид поля в шапке: рамка фирменного цвета и кнопка поиска внутри неё справа.
 * Фон, тень и подсветку фокуса рисует контейнер, поэтому у самого поля всё это
 * снято — иначе получается рамка в рамке.
 */
const MARKETPLACE_BOX =
  "h-10 rounded-lg border-2 border-primary bg-card p-[3px] focus-within:ring-3 focus-within:ring-primary/15";

/**
 * Кнопка поиска отделена от края только полем контейнера, и цвет у них один —
 * поэтому справа она выглядит вровень с рамкой, а выбор раздела слева остаётся
 * отдельной плашкой на белом. Ровно так же собрано поле у крупных площадок.
 */
const MARKETPLACE_SCOPE =
  "h-full max-w-32 shrink-0 rounded-md px-2.5 text-[13px] font-normal";
const MARKETPLACE_INPUT =
  "h-full min-w-0 flex-1 rounded-none bg-transparent px-2.5 text-sm shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent";
const MARKETPLACE_BUTTON = "h-full w-13 shrink-0 rounded-md px-0";

export function SearchBar({
  className,
  size = "default",
  appearance = "default",
  placeholder,
  autoFocus,
}: {
  className?: string;
  size?: "default" | "lg";
  /**
   * «marketplace» — вид как у крупных площадок: поле в рамке и кнопка поиска
   * справа внутри неё. Нужен в шапке витрины, где поиск главный элемент строки
   * и должен читаться отдельным блоком, а не ещё одним серым полем.
   */
  appearance?: "default" | "marketplace";
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useT();
  const { roots } = useCategories();

  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const onCatalog = pathname === CATALOG_PATH;
  const marketplace = appearance === "marketplace";

  const [value, setValue] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activeRoot = roots.find(
    (root) => root.slug === searchParams.get("category"),
  );

  const typed = useRef(false);

  /**
   * Поле следует за адресом, а не живёт своей жизнью: по ссылке `/?q=canon`
   * человек должен увидеть запрос в поле, а не пустую строку над найденным.
   * Приведение состояния во время рендера, а не в эффекте — иначе один кадр
   * показывал бы прежний текст.
   */
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (onCatalog && urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    // Свои же правки адреса пропускаем: иначе набранный пробел исчезал бы
    // из-под курсора, ведь в адрес уходит обрезанная строка.
    if (urlQuery !== value.trim()) setValue(urlQuery);
  }

  // Остальные параметры каталога сохраняем: запрос сужает текущую выдачу, а не
  // начинает пустую — выбранный раздел никуда не девается.
  const catalogUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams(
        onCatalog ? searchParams.toString() : "",
      );
      if (q) params.set("q", q);
      else params.delete("q");
      const query = params.toString();
      return query ? `${CATALOG_PATH}?${query}` : CATALOG_PATH;
    },
    [onCatalog, searchParams],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    typed.current = false;
    router.push(catalogUrl(value.trim()));
  };

  const clear = () => {
    typed.current = false;
    setValue("");
    inputRef.current?.focus();
    if (onCatalog) router.replace(catalogUrl(""), { scroll: false });
  };

  const scopeUrl = (category?: string) => {
    const params = new URLSearchParams(onCatalog ? searchParams.toString() : "");
    const query = value.trim();
    if (query) params.set("q", query);
    else params.delete("q");
    if (category) params.set("category", category);
    else params.delete("category");
    params.delete("sub");
    const next = params.toString();
    return next ? `${CATALOG_PATH}?${next}` : CATALOG_PATH;
  };

  // Живой поиск: на самом каталоге набор текста обновляет адрес после паузы.
  // На других страницах строка выдёргивала бы человека со страницы посреди
  // слова, поэтому там переход только по Enter.
  useEffect(() => {
    if (!typed.current || !onCatalog) return;

    const q = value.trim();
    if (q === urlQuery) return;

    const id = setTimeout(() => {
      router.replace(catalogUrl(q), { scroll: false });
    }, DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value, urlQuery, onCatalog, router, catalogUrl]);

  return (
    <form
      role="search"
      onSubmit={submit}
      className={cn(
        "relative flex w-full items-center",
        marketplace && MARKETPLACE_BOX,
        className,
      )}
    >
      {!marketplace && (
        <Search
          className={cn(
            "pointer-events-none absolute left-3.5 text-muted-foreground",
            size === "lg" ? "size-5" : "size-4",
          )}
        />
      )}
      {marketplace && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className={cn("hidden sm:inline-flex", MARKETPLACE_SCOPE)}
            >
              <span className="truncate">
                {activeRoot?.name[locale] ?? t("catalog.everywhere")}
              </span>
              <ChevronDown
                data-icon="inline-end"
                className="size-3.5 opacity-50"
              />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="max-h-80 min-w-64 overflow-y-auto"
          >
            <DropdownMenuLabel>{t("nav.catalog")}</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={scopeUrl()}>{t("catalog.everywhere")}</Link>
              </DropdownMenuItem>
              {roots.map((root) => (
                <DropdownMenuItem key={root.id} asChild>
                  <Link href={scopeUrl(root.slug)}>
                    <CategoryIcon name={root.icon} />
                    {root.name[locale]}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <Input
        ref={inputRef}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          typed.current = true;
          setValue(e.target.value);
        }}
        aria-label={
          placeholder ??
          t(
            marketplace
              ? "common.headerSearchPlaceholder"
              : "common.searchPlaceholder",
          )
        }
        placeholder={
          placeholder ??
          t(
            marketplace
              ? "common.headerSearchPlaceholder"
              : "common.searchPlaceholder",
          )
        }
        className={cn(
          "pl-10 pr-10",
          size === "lg" && "h-13 rounded-xl pl-11 text-base shadow-sm",
          marketplace && MARKETPLACE_INPUT,
        )}
      />
      {value && (
        // Единственный способ вернуть полный каталог: панели фильтров, где
        // раньше был сброс, больше нет.
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={clear}
          aria-label={t("common.clear")}
          className={cn(
            marketplace
              ? // Обычным элементом строки, а не поверх неё: рядом кнопка
                // поиска, и любой зашитый отступ разъезжался бы вместе с ней.
                "mr-1 shrink-0 text-muted-foreground"
              : "absolute right-2",
          )}
        >
          <X />
        </Button>
      )}
      {marketplace && (
        <Button
          type="submit"
          aria-label={t("common.search")}
          title={t("common.search")}
          className={MARKETPLACE_BUTTON}
        >
          <Search />
        </Button>
      )}
    </form>
  );
}

/**
 * Заглушка на время серверного рендера. Строка поиска читает адресную строку,
 * а это возможно только в браузере; без заглушки шапка на долю секунды
 * оставалась бы без поля, и содержимое рядом прыгало бы вбок.
 */
export function SearchBarSkeleton({
  className,
  appearance = "default",
}: {
  className?: string;
  appearance?: "default" | "marketplace";
}) {
  const marketplace = appearance === "marketplace";

  return (
    <div
      className={cn(
        "relative flex w-full items-center",
        marketplace && MARKETPLACE_BOX,
        className,
      )}
    >
      {!marketplace && (
        <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
      )}
      {marketplace && (
        <Button
          disabled
          variant="secondary"
          size="sm"
          className={cn("hidden w-22 sm:inline-flex", MARKETPLACE_SCOPE)}
          aria-hidden
        >
          {" "}
        </Button>
      )}
      <Input
        disabled
        className={cn("pl-10 pr-10", marketplace && MARKETPLACE_INPUT)}
      />
      {marketplace && (
        <Button disabled className={MARKETPLACE_BUTTON}>
          <Search />
        </Button>
      )}
    </div>
  );
}
