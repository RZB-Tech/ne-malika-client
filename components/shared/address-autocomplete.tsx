"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  suggestPlaces,
  type PlaceSuggestion,
  type SuggestKind,
} from "@/lib/geo-suggest";

export function AddressAutocomplete({
  value,
  onChange,
  kind,
  city,
  id,
  placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  kind: SuggestKind;
  /** For address lookups — biases suggestions to this city. */
  city?: string;
  id?: string;
  placeholder?: string;
  className?: string;
}) {
  const [items, setItems] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const acRef = useRef<AbortController | null>(null);
  // Skip the fetch triggered by our own onChange after picking a suggestion.
  const skipRef = useRef(false);
  // Suggestions are a reaction to typing. Until the user types, `value` changes
  // come from the parent (mount, form hydration) and must not open the list.
  const typedRef = useRef(false);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!typedRef.current) return;
    const timer = setTimeout(async () => {
      if (skipRef.current) {
        skipRef.current = false;
        return;
      }
      if (value.trim().length < 2) {
        setItems([]);
        setOpen(false);
        return;
      }
      acRef.current?.abort();
      const ac = new AbortController();
      acRef.current = ac;
      setLoading(true);
      const res = await suggestPlaces(value, { kind, city, signal: ac.signal });
      if (ac.signal.aborted) return;
      setItems(res);
      setOpen(res.length > 0);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [value, kind, city]);

  const pick = (s: PlaceSuggestion) => {
    skipRef.current = true;
    onChange(s.value);
    setOpen(false);
    setItems([]);
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          typedRef.current = true;
          onChange(e.target.value);
        }}
        onFocus={() => items.length > 0 && setOpen(true)}
      />
      {loading && (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      )}

      {open && items.length > 0 && (
        <ul className="absolute z-50 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg bg-popover p-1 text-sm text-popover-foreground shadow-md ring-1 ring-foreground/10">
          {items.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-muted"
              >
                <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                <span className="min-w-0">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
