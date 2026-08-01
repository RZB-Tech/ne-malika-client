"use client";

import { Scale } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useCompare } from "@/lib/compare/use-compare";
import type { ProductSnapshot } from "@/lib/product-snapshot";
import { cn } from "@/lib/utils";

/**
 * Кнопка «к сравнению». Список локальный, поэтому нажатие срабатывает мгновенно
 * и работает без входа.
 */
export function CompareButton({
  product,
  variant = "icon",
  className,
}: {
  product: ProductSnapshot;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { t } = useT();
  const { has, toggle, isFull, max } = useCompare();

  const active = has(product.id);
  const label = active ? t("compare.remove") : t("compare.add");

  const onClick = () => {
    const added = toggle(product);
    // Отказ бывает единственной причины — мест больше нет. Молчать здесь
    // нельзя: нажатие внешне ничего не изменит, и это выглядит как поломка.
    if (!added && !active) {
      toast.message(t("compare.limitReached", { count: max }));
    }
  };

  if (variant === "full") {
    return (
      <Button
        type="button"
        variant="outline"
        aria-pressed={active}
        disabled={isFull && !active}
        onClick={onClick}
        className={cn("gap-2", active && "text-primary", className)}
      >
        <Scale className="size-4" />
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
      onClick={onClick}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-full bg-background/85 shadow-sm backdrop-blur transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
        // Полный список не прячем, а гасим: исчезнувшая кнопка выглядит как сбой.
        isFull && !active && "opacity-40",
        className,
      )}
    >
      <Scale className="size-4" />
    </button>
  );
}
