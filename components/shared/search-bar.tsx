"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/components/providers/i18n-provider";

export function SearchBar({
  className,
  size = "default",
  placeholder,
  autoFocus,
  defaultValue = "",
  withButton = false,
}: {
  className?: string;
  size?: "default" | "lg";
  placeholder?: string;
  autoFocus?: boolean;
  defaultValue?: string;
  withButton?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();
  const [value, setValue] = useState(defaultValue);

  // Several search bars are mounted at once (header + mobile sheet). Only the
  // one the user is actually typing into may drive the URL.
  const typed = useRef(false);
  const lastPushed = useRef(defaultValue.trim());

  // Keep whatever else the catalog put in the URL (price bounds, sort) — typing
  // a query narrows the current search rather than starting a blank one.
  const catalogUrl = useCallback(
    (q: string) => {
      const params = new URLSearchParams(
        pathname === "/" ? window.location.search : "",
      );
      if (q) params.set("q", q);
      else params.delete("q");
      const query = params.toString();
      return query ? `/?${query}` : "/";
    },
    [pathname],
  );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    typed.current = false;
    lastPushed.current = value.trim();
    router.push(catalogUrl(value.trim()));
  };

  // Live search: on the catalog itself, typing updates the URL after a pause.
  // Elsewhere the bar would yank the user off the page mid-keystroke, so there
  // it stays submit-driven.
  useEffect(() => {
    if (!typed.current || pathname !== "/") return;

    const q = value.trim();
    if (q === lastPushed.current) return;

    const id = setTimeout(() => {
      lastPushed.current = q;
      router.replace(catalogUrl(q), { scroll: false });
    }, 300);
    return () => clearTimeout(id);
  }, [value, pathname, router, catalogUrl]);

  return (
    <form onSubmit={submit} className={cn("relative flex w-full items-center", className)}>
      <Search
        className={cn(
          "pointer-events-none absolute left-3.5 text-muted-foreground",
          size === "lg" ? "size-5" : "size-4",
        )}
      />
      <Input
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => {
          typed.current = true;
          setValue(e.target.value);
        }}
        placeholder={placeholder ?? t("common.searchPlaceholder")}
        className={cn(
          "pl-10",
          size === "lg" && "h-13 rounded-xl pl-11 text-base shadow-sm",
          withButton && (size === "lg" ? "pr-32" : "pr-24"),
        )}
      />
    </form>
  );
}
