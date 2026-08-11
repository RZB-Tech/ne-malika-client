"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";

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
  "h-11 gap-1 rounded-2xl border-2 border-primary bg-background p-1 focus-within:ring-3 focus-within:ring-primary/15";
const MARKETPLACE_INPUT =
  "h-full flex-1 rounded-xl bg-transparent pl-3 pr-9 shadow-none hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent dark:focus-visible:bg-transparent";
const MARKETPLACE_BUTTON =
  "grid h-full w-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground transition-colors outline-none hover:bg-primary/90 focus-visible:ring-3 focus-visible:ring-primary/30";

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
  const { t } = useT();

  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const onCatalog = pathname === CATALOG_PATH;
  const marketplace = appearance === "marketplace";

  const [value, setValue] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Несколько строк поиска могут быть смонтированы разом (шапка и шторка).
  // Адрес меняет только та, в которой действительно печатают.
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
      <Input
        ref={inputRef}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          typed.current = true;
          setValue(e.target.value);
        }}
        aria-label={placeholder ?? t("common.searchPlaceholder")}
        placeholder={placeholder ?? t("common.searchPlaceholder")}
        className={cn(
          "pl-10 pr-10",
          size === "lg" && "h-13 rounded-xl pl-11 text-base shadow-sm",
          marketplace && MARKETPLACE_INPUT,
        )}
      />
      {value && (
        // Единственный способ вернуть полный каталог: панели фильтров, где
        // раньше был сброс, больше нет.
        <button
          type="button"
          onClick={clear}
          aria-label={t("common.clear")}
          className={cn(
            "absolute grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            // Правее — кнопка поиска, крестик встаёт перед ней.
            marketplace ? "right-12" : "right-2",
          )}
        >
          <X className="size-4" />
        </button>
      )}
      {marketplace && (
        <button
          type="submit"
          aria-label={t("common.search")}
          title={t("common.search")}
          className={MARKETPLACE_BUTTON}
        >
          <Search className="size-[1.15rem]" />
        </button>
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
      <Input
        disabled
        className={cn("pl-10 pr-10", marketplace && MARKETPLACE_INPUT)}
      />
      {marketplace && (
        <span className={MARKETPLACE_BUTTON}>
          <Search className="size-[1.15rem]" />
        </span>
      )}
    </div>
  );
}
