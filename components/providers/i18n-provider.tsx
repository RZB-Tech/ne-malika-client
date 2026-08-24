"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getMessages, loadMessages } from "@/lib/i18n/messages";
import ru from "@/lib/i18n/locales/ru.json";
import {
  defaultLocale,
  type Locale,
  locales,
  STORAGE_KEY,
} from "@/lib/i18n/config";
import { setRequestLocale } from "@/lib/api/mutator";

type Vars = Record<string, string | number>;

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (path: string, vars?: Vars) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(obj: unknown, path: string): string {
  const value = path
    .split(".")
    .reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  return typeof value === "string" ? value : path;
}

/**
 * Подстановка значений в строку перевода.
 *
 * Пустое значение оставляет плейсхолдер нетронутым — как и вовсе не переданный
 * ключ. Раньше `String(undefined)` подставлял в текст слово «undefined», и
 * пользователь читал «Подойдёт размер undefined» как настоящее сообщение;
 * `{sizes}` на его месте хотя бы честно выглядит поломкой, а не требованием.
 *
 * Такое случается, когда константу переименовали, а импорт остался старым:
 * типы это ловят, но не поймает устаревший кэш сборки.
 */
function interpolate(str: string, vars?: Vars): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) =>
    vars[k] === undefined || vars[k] === null ? `{${k}}` : String(vars[k]),
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  /** Счётчик догрузок словаря: сигнал перерисоваться, когда чанк узбекского приехал. */
  const [dictVersion, setDictVersion] = useState(0);

  const apply = useCallback((l: Locale) => {
    setLocaleState(l);
    setRequestLocale(l);
    void loadMessages(l).then(() => setDictVersion((v) => v + 1));
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored && locales.includes(stored)) apply(stored);
  }, [apply]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (l: Locale) => {
      localStorage.setItem(STORAGE_KEY, l);
      apply(l);
    },
    [apply],
  );

  const t = useCallback(
    (path: string, vars?: Vars) =>
      interpolate(resolve(getMessages(locale) ?? ru, path), vars),
    // dictVersion не читается телом, но t должен пересоздаться после догрузки
    // словаря — иначе интерфейс так и останется русским до следующего рендера.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locale, dictVersion],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Shorthand hook returning just the translate function + locale. */
export function useT() {
  const { t, locale } = useI18n();
  return { t, locale };
}
