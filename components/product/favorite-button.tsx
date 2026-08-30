"use client";

import { Heart } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { GOALS, reachGoal } from "@/lib/metrika";
import type { ProductSnapshot } from "@/lib/product-snapshot";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  product,
  variant = "icon",
  className,
}: {
  product: ProductSnapshot;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { t } = useT();
  const { has, toggle } = useFavorites();

  const active = has(product.id);
  const label = active ? t("favorites.remove") : t("favorites.add");

  // Цель только на добавление: снятие сердечка — не интерес к товару, а отказ,
  // и в одной цели с добавлением оно бы обнуляло смысл цифры.
  const click = () => {
    if (!active) reachGoal(GOALS.favoriteAdd, { productId: Number(product.id) || undefined });
    void toggle(product);
  };

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        aria-pressed={active}
        onClick={click}
        className={cn("gap-2", active && "text-destructive", className)}
      >
        <Heart className={cn("size-4", active && "fill-current")} />
        {label}
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={click}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-card/85 shadow-sm backdrop-blur transition-colors hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active ? "text-destructive" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4", active && "fill-current")} />
    </button>
  );
}
