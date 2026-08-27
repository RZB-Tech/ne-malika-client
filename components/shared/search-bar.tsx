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

const CATALOG_PATH = "/";

const DEBOUNCE_MS = 300;

const MARKETPLACE_BOX =
  "h-10 rounded-lg border-2 border-primary bg-card p-[3px] focus-within:ring-3 focus-within:ring-primary/15";

const MARKETPLACE_SCOPE = "h-full max-w-32 shrink-0 rounded-md px-2.5 text-[13px] font-normal";
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
  const activeRoot = roots.find((root) => root.slug === searchParams.get("category"));

  const typed = useRef(false);

  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (onCatalog && urlQuery !== syncedQuery) {
    setSyncedQuery(urlQuery);
    if (urlQuery !== value.trim()) setValue(urlQuery);
  }

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
      className={cn("relative flex w-full items-center", marketplace && MARKETPLACE_BOX, className)}
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
              <ChevronDown data-icon="inline-end" className="size-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-80 min-w-64 overflow-y-auto">
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
          t(marketplace ? "common.headerSearchPlaceholder" : "common.searchPlaceholder")
        }
        placeholder={
          placeholder ??
          t(marketplace ? "common.headerSearchPlaceholder" : "common.searchPlaceholder")
        }
        className={cn(
          "pl-10 pr-10",
          size === "lg" && "h-13 rounded-xl pl-11 text-base shadow-sm",
          marketplace && MARKETPLACE_INPUT,
        )}
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={clear}
          aria-label={t("common.clear")}
          className={cn(marketplace ? "mr-1 shrink-0 text-muted-foreground" : "absolute right-2")}
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
      className={cn("relative flex w-full items-center", marketplace && MARKETPLACE_BOX, className)}
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
      <Input disabled className={cn("pl-10 pr-10", marketplace && MARKETPLACE_INPUT)} />
      {marketplace && (
        <Button disabled className={MARKETPLACE_BUTTON}>
          <Search />
        </Button>
      )}
    </div>
  );
}
