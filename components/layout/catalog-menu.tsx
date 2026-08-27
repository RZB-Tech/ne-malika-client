"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  RefreshCw,
  TriangleAlert,
  X,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CategoryIcon } from "@/components/shared/category-icon";
import { StatusPanel } from "@/components/shared/status-panel";
import { useT } from "@/components/providers/i18n-provider";
import { useCategories } from "@/lib/api/categories";
import { onOpenCatalog } from "./catalog-bus";
import type { CategoryDto } from "@/lib/api/generated/schemas";
import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

const EXIT_MS = 200;

function categoryHref(root: CategoryDto, child?: CategoryDto): string {
  return child ? `/?category=${root.slug}&sub=${child.id}` : `/?category=${root.slug}`;
}

export function CatalogMenu() {
  const { t, locale } = useT();
  const { roots, isLoading, isError, refetch } = useCategories();

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [drilled, setDrilled] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const active = roots.find((r) => r.id === activeId) ?? roots[0];
  const activeHasGroups = active?.children.some((child) => child.children.length > 0) ?? false;

  const openMenu = useCallback(() => {
    clearTimeout(unmountTimer.current);
    setMounted(true);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    unmountTimer.current = setTimeout(() => {
      setMounted(false);
      setDrilled(false);
    }, EXIT_MS);
  }, []);

  useEffect(() => () => clearTimeout(unmountTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => onOpenCatalog(openMenu), [openMenu]);

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
        size="default"
        className={cn("hidden h-10 gap-2 rounded-lg px-3 sm:px-4 md:inline-flex")}
        onClick={() => (open ? close() : openMenu())}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span data-icon="inline-start" className="relative grid size-5 place-items-center">
          <LayoutGrid
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

      {mounted && (
        <>
          <div
            data-state={open ? "open" : "closed"}
            className="absolute inset-x-0 top-full z-40 h-screen bg-black/40 duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 lg:top-17 lg:h-[calc(100dvh-4.25rem)]"
            aria-hidden
          />
          <div
            data-state={open ? "open" : "closed"}
            className={cn(
              "absolute inset-x-0 top-full z-50 overflow-hidden rounded-b-2xl border-b border-border bg-card shadow-xl duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-2 lg:top-17",
              roots.length > 0 &&
                "lg:h-[calc(100dvh-4.25rem)] lg:rounded-none lg:border-b-0 lg:shadow-none",
            )}
          >
            <div
              className={cn(
                "mx-auto max-h-[min(70vh,40rem)] max-w-site overflow-y-auto px-4 py-4 sm:px-8 lg:py-5",
                roots.length > 0 && "lg:h-full lg:max-h-none lg:overflow-hidden",
              )}
            >
              {isError ? (
                <StatusPanel
                  compact
                  tone="error"
                  icon={<TriangleAlert className="size-5" />}
                  title={t("catalog.errorTitle")}
                  description={t("catalog.categoriesLoadError")}
                  action={
                    <div className="flex flex-wrap justify-center gap-2">
                      <Button type="button" size="sm" onClick={() => void refetch()}>
                        <RefreshCw data-icon="inline-start" />
                        {t("common.retry")}
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={close}>
                        {t("common.close")}
                      </Button>
                    </div>
                  }
                />
              ) : roots.length === 0 ? (
                <StatusPanel
                  compact
                  title={isLoading ? t("common.loading") : t("common.nothingFound")}
                />
              ) : (
                <>
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
                              <span className="flex-1">{root.name[locale]}</span>
                              <ChevronRight className="size-4 text-muted-foreground" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="hidden h-full lg:grid lg:grid-cols-[19rem_minmax(0,1fr)]">
                    <div className="flex min-h-0 flex-col border-r border-border pr-5">
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="mb-4 h-14 w-full justify-start gap-3 rounded-xl px-4"
                      >
                        <Link href="/" onClick={close}>
                          <LayoutGrid data-icon="inline-start" />
                          <span className="flex-1 text-left">{t("catalog.allSections")}</span>
                          <ChevronRight data-icon="inline-end" />
                        </Link>
                      </Button>

                      <ScrollArea className="min-h-0 flex-1">
                        <ul className="pr-3">
                          {roots.map((root) => (
                            <li key={root.id}>
                              <Link
                                href={categoryHref(root)}
                                onClick={close}
                                onMouseEnter={() => setActiveId(root.id)}
                                onFocus={() => setActiveId(root.id)}
                                className={cn(
                                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                                  root.id === active?.id
                                    ? "bg-muted font-medium text-primary"
                                    : "text-foreground hover:bg-muted/60",
                                )}
                              >
                                <CategoryIcon
                                  name={root.icon}
                                  className="size-4 text-muted-foreground"
                                />
                                <span className="min-w-0 flex-1 truncate">{root.name[locale]}</span>
                                <ChevronRight className="size-4 opacity-35" />
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>

                    {active && (
                      <ScrollArea className="h-full min-w-0 pl-9">
                        <div className="pr-8 pb-12">
                          <Link
                            href={categoryHref(active)}
                            onClick={close}
                            className="inline-flex font-heading text-3xl font-bold tracking-tight hover:text-primary"
                          >
                            {active.name[locale]}
                          </Link>

                          {activeHasGroups ? (
                            <div className="mt-7 columns-2 gap-12 xl:columns-3">
                              {active.children.map((child) => (
                                <section key={child.id} className="mb-8 break-inside-avoid">
                                  <Link
                                    href={categoryHref(active, child)}
                                    onClick={close}
                                    className="font-semibold text-foreground hover:text-primary"
                                  >
                                    {child.name[locale]}
                                  </Link>
                                  <div className="mt-2 flex flex-col gap-1.5">
                                    {child.children.map((leaf) => (
                                      <Link
                                        key={leaf.id}
                                        href={categoryHref(active, leaf)}
                                        onClick={close}
                                        className="text-sm leading-5 text-muted-foreground hover:text-primary"
                                      >
                                        {leaf.name[locale]}
                                      </Link>
                                    ))}
                                  </div>
                                </section>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-7 grid grid-cols-2 gap-x-14 gap-y-3 xl:grid-cols-3">
                              {active.children.map((child) => (
                                <Link
                                  key={child.id}
                                  href={categoryHref(active, child)}
                                  onClick={close}
                                  className="text-sm leading-5 text-muted-foreground hover:text-primary"
                                >
                                  {child.name[locale]}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </ScrollArea>
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
