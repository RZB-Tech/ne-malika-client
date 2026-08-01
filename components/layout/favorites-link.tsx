"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { cn } from "@/lib/utils";

/** Сердце со счётчиком в шапке. Ведёт сразу на вкладку избранного в кабинете. */
export function FavoritesLink({ className }: { className?: string }) {
  const { t } = useT();
  const { count } = useFavorites();

  return (
    <Button
      asChild
      variant="ghost"
      size="icon-sm"
      className={cn("relative shrink-0", className)}
      aria-label={t("account.tabs.favorites")}
      title={t("account.tabs.favorites")}
    >
      <Link href="/account?tab=favorites">
        <Heart className="size-[1.15rem]" />
        {count > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}
