import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { getCategory } from "@/lib/data";

/**
 * Deterministic product artwork. Real photos aren't part of this frontend MVP,
 * so we render a tasteful, brand-tinted tile with the category glyph — stable
 * per product, and it never breaks like a remote image would.
 */
export function ProductImage({
  hue,
  categorySlug,
  className,
  iconClassName,
}: {
  hue: number;
  categorySlug: string;
  className?: string;
  iconClassName?: string;
}) {
  const iconName = getCategory(categorySlug)?.icon ?? "Box";
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden text-foreground/55",
        className,
      )}
      style={{
        backgroundImage: `radial-gradient(120% 120% at 30% 15%, oklch(0.965 0.045 ${hue}) 0%, oklch(0.9 0.06 ${hue}) 48%, oklch(0.82 0.085 ${hue}) 100%)`,
      }}
    >
      {/* dark-theme wash overlays the light gradient */}
      <div
        className="absolute inset-0 opacity-0 dark:opacity-100"
        style={{
          backgroundImage: `radial-gradient(120% 120% at 30% 15%, oklch(0.33 0.055 ${hue}) 0%, oklch(0.26 0.045 ${hue}) 55%, oklch(0.2 0.035 ${hue}) 100%)`,
        }}
      />
      {/* dotted texture */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />
      <CategoryIcon
        name={iconName}
        className={cn("relative z-10 drop-shadow-sm", iconClassName)}
        strokeWidth={1.25}
      />
    </div>
  );
}
