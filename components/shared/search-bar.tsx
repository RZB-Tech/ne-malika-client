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

export function SearchBar({
  className,
  size = "default",
  placeholder,
  autoFocus,
}: {
  className?: string;
  size?: "default" | "lg";
  placeholder?: string;
  autoFocus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t } = useT();

  const urlQuery = searchParams.get("q")?.trim() ?? "";
  const onCatalog = pathname === CATALOG_PATH;

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
      const params = new URLSearchParams(onCatalog ? searchParams.toString() : "");
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
      className={cn("relative flex w-full items-center", className)}
    >
      <Search
        className={cn(
          "pointer-events-none absolute left-3.5 text-muted-foreground",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
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
        )}
      />
      {value && (
        // Единственный способ вернуть полный каталог: панели фильтров, где
        // раньше был сброс, больше нет.
        <button
          type="button"
          onClick={clear}
          aria-label={t("common.clear")}
          className="absolute right-2 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
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
export function SearchBarSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex w-full items-center", className)}>
      <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
      <Input disabled className="pl-10 pr-10" />
    </div>
  );
}
