"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const { t } = useT();
  const [value, setValue] = useState(defaultValue);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/catalog?q=${encodeURIComponent(q)}` : "/catalog");
  };

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
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? t("common.searchPlaceholder")}
        className={cn(
          "pl-10",
          size === "lg" && "h-13 rounded-xl pl-11 text-base shadow-sm",
          withButton && (size === "lg" ? "pr-32" : "pr-24"),
        )}
      />
      {withButton && (
        <Button
          type="submit"
          size={size === "lg" ? "default" : "sm"}
          className={cn("absolute right-1.5", size === "lg" && "right-2 h-10 px-5")}
        >
          {t("common.search")}
        </Button>
      )}
    </form>
  );
}
