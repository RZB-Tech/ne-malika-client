"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/shared/category-icon";
import { useT } from "@/components/providers/i18n-provider";
import { useCategories } from "@/lib/api/categories";
import type { CategoryDto } from "@/lib/api/generated/schemas";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/** Должно совпадать с duration-200 у панели: раньше времени снимать её нельзя. */
const EXIT_MS = 200;

/** Ссылка на раздел каталога. Лист адресуем id — его slug уникален лишь внутри раздела. */
function categoryHref(root: CategoryDto, child?: CategoryDto): string {
  return child
    ? `/?category=${root.slug}&sub=${child.id}`
    : `/?category=${root.slug}`;
}

/**
 * Меню каталога из шапки. На широком экране — две колонки: разделы слева,
 * подкатегории наведённого раздела справа. На узком — тот же список с
 * проваливанием внутрь раздела: полторы сотни ссылок сразу на телефон не влезают.
 */
export function CatalogMenu() {
  const { t, locale } = useT();
  const { roots, isLoading } = useCategories();

  // Два состояния вместо одного: `open` ведёт анимацию, `mounted` держит панель
  // в DOM. Убрать её сразу по клику — значит не показать закрытие вовсе.
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [drilled, setDrilled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const active = roots.find((r) => r.id === activeId) ?? roots[0];

  const openMenu = useCallback(() => {
    clearTimeout(unmountTimer.current);
    setMounted(true);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Открытие во время закрытия отменяет снятие с DOM — иначе панель мигнёт.
    unmountTimer.current = setTimeout(() => {
      setMounted(false);
      setDrilled(false);
    }, EXIT_MS);
  }, []);

  useEffect(() => () => clearTimeout(unmountTimer.current), []);

  // Шапка живёт в layout и не размонтируется при переходах, поэтому панель
  // закрывают сами обработчики: ссылки внутри — по клику, всё снаружи — по
  // pointerdown мимо панели. Отдельно слушаем «назад/вперёд»: там клика нет.
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onPointer = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) close();
    };

    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("popstate", close);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("popstate", close);
    };
  }, [open, close]);

  return (
    <div ref={containerRef} className="shrink-0">
      <Button
        // Синяя на светлой шапке: это главная кнопка навигации, и она должна
        // читаться первой, до строки поиска.
        size="lg"
        className={cn("h-11 gap-2 rounded-xl px-3 sm:px-4")}
        onClick={() => (open ? close() : openMenu())}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Иконки меняются местами плавно: без этого «крестик» щёлкает. */}
        <span
          data-icon="inline-start"
          className="relative grid size-5 place-items-center"
        >
          <LayoutGrid
            fill="currentColor"
            strokeWidth={0}
            className={cn(
              "absolute transition-all duration-200",
              open ? "scale-75 opacity-0" : "scale-100 opacity-100",
            )}
          />
          <X
            className={cn(
              "absolute transition-all duration-200",
              open ? "scale-100 opacity-100" : "scale-75 opacity-0",
            )}
          />
        </span>
        <span className="hidden sm:inline">{t("nav.catalog")}</span>
      </Button>

      {/* Панель и затемнение позиционируются от самой шапки (`top-full`), а не
          от окна с фиксированным отступом: у шапки теперь три уровня, и любой
          зашитый отступ разъезжался бы при каждой правке её высоты. */}
      {mounted && (
        <>
          {/* Затемнение — только под панелью, шапка остаётся кликабельной. */}
          <div
            data-state={open ? "open" : "closed"}
            className="absolute inset-x-0 top-full z-40 h-screen bg-black/40 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0"
            aria-hidden
          />
          <div
            data-state={open ? "open" : "closed"}
            className="absolute inset-x-0 top-full z-50 border-b border-border bg-card shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-4 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-4"
          >
            <div className="mx-auto max-h-[min(70vh,40rem)] max-w-[1600px] overflow-y-auto px-4 py-4 sm:px-8 lg:px-10">
              {roots.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {isLoading ? t("common.loading") : t("common.nothingFound")}
                </p>
              ) : (
                <>
                  {/* Узкий экран: либо список разделов, либо содержимое одного. */}
                  <div className="lg:hidden">
                    {drilled && active ? (
                      <MobileChildren
                        root={active}
                        locale={locale}
                        onBack={() => setDrilled(false)}
                        onNavigate={close}
                      />
                    ) : (
                      <ul className="divide-y divide-border">
                        {roots.map((root) => (
                          <li key={root.id}>
                            <button
                              type="button"
                              className="flex w-full items-center gap-3 py-3 text-left text-sm"
                              onClick={() => {
                                setActiveId(root.id);
                                setDrilled(true);
                              }}
                            >
                              <CategoryIcon
                                name={root.icon}
                                className="size-5 text-muted-foreground"
                              />
                              <span className="flex-1">
                                {root.name[locale]}
                              </span>
                              <ChevronRight className="size-4 text-muted-foreground" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Широкий экран: разделы и подкатегории рядом. */}
                  <div className="hidden gap-8 lg:grid lg:grid-cols-[16rem_1fr]">
                    <ul className="max-h-[min(60vh,34rem)] overflow-y-auto pr-2">
                      {roots.map((root) => (
                        <li key={root.id}>
                          <Link
                            href={categoryHref(root)}
                            onClick={close}
                            onMouseEnter={() => setActiveId(root.id)}
                            onFocus={() => setActiveId(root.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              root.id === active?.id
                                ? "bg-muted font-medium text-foreground"
                                : "text-muted-foreground hover:bg-muted/60",
                            )}
                          >
                            <CategoryIcon
                              name={root.icon}
                              className="size-4"
                            />
                            <span className="flex-1">{root.name[locale]}</span>
                            <ChevronRight className="size-4 opacity-50" />
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {active && (
                      <div className="min-w-0">
                        <Link
                          href={categoryHref(active)}
                          onClick={close}
                          className="font-heading text-lg font-bold tracking-tight hover:text-primary"
                        >
                          {active.name[locale]}
                        </Link>
                        <div className="mt-4 columns-2 gap-8 xl:columns-3">
                          {active.children.map((child) => (
                            <Link
                              key={child.id}
                              href={categoryHref(active, child)}
                              onClick={close}
                              className="mb-2 block break-inside-avoid text-sm text-muted-foreground hover:text-primary"
                            >
                              {child.name[locale]}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MobileChildren({
  root,
  locale,
  onBack,
  onNavigate,
}: {
  root: CategoryDto;
  locale: Locale;
  onBack: () => void;
  onNavigate: () => void;
}) {
  const { t } = useT();
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("catalog.allSections")}
      </button>

      <Link
        href={categoryHref(root)}
        onClick={onNavigate}
        className="block py-2 font-heading text-lg font-bold tracking-tight"
      >
        {root.name[locale]}
      </Link>

      <ul className="divide-y divide-border">
        {root.children.map((child) => (
          <li key={child.id}>
            <Link
              href={categoryHref(root, child)}
              onClick={onNavigate}
              className="block py-3 text-sm text-muted-foreground"
            >
              {child.name[locale]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
