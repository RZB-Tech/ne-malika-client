"use client";

import { Scale } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useCompare } from "@/lib/compare/use-compare";
import type { ProductSnapshot } from "@/lib/product-snapshot";
import { cn } from "@/lib/utils";

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
        "inline-flex size-8 items-center justify-center rounded-full bg-card/85 shadow-sm backdrop-blur transition-colors hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
        isFull && !active && "opacity-40",
        className,
      )}
    >
      <Scale className="size-4" />
    </button>
  );
}
