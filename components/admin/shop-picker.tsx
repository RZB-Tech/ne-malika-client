"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import type { AdminShopRow } from "@/lib/api/types";

/**
 * Выбор магазина с поиском. Обычный <Select> здесь не годится: магазинов
 * сотни, а поле ввода внутри радиксовского списка перехватывается его же
 * типизацией по буквам — поэтому свой выпадающий список.
 */
export function ShopPicker({
  shops,
  value,
  onChange,
  emptyHint,
}: {
  shops: AdminShopRow[];
  value: number | null;
  onChange: (id: number) => void;
  /** По умолчанию — «подходящих магазинов нет» на языке интерфейса. */
  emptyHint?: string;
}) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = shops.find((s) => s.id === value) ?? null;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return shops;
    return shops.filter((s) =>
      [s.name, s.ownerName, s.contact, s.address ?? ""].some((v) =>
        v.toLowerCase().includes(needle),
      ),
    );
  }, [shops, q]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const pick = (id: number) => {
    onChange(id);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent py-2 pr-3 pl-3.5 text-sm transition-colors outline-none select-none focus-visible:border-foreground/40 dark:bg-input/30 dark:hover:bg-input/50"
      >
        <span className={cn("truncate", !selected && "text-muted-foreground")}>
          {selected ? selected.name : t("admin.shopPicker.choose")}
        </span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover shadow-md">
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filtered[0]) pick(filtered[0].id);
                }
              }}
              placeholder={t("admin.shopPicker.search")}
              className="rounded-none border-0 pl-9 shadow-none focus-visible:ring-0"
            />
          </div>

          <div className="max-h-64 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {shops.length === 0
                  ? (emptyHint ?? t("admin.shopPicker.empty"))
                  : t("common.nothingFound")}
              </p>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="option"
                  aria-selected={s.id === value}
                  onClick={() => pick(s.id)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                >
                  <StoreAvatar
                    name={s.name}
                    hue={hueFromId(s.id)}
                    src={photoUrl(s.photo)}
                    className="size-7 shrink-0 rounded-md text-[10px]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{s.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {s.ownerName}
                    </span>
                  </span>
                  {s.id === value && <Check className="size-4 shrink-0" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
