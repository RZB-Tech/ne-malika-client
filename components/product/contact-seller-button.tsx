"use client";

import type { ComponentProps } from "react";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { trackContact } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function ContactSellerButton({
  productId,
  label,
  className,
  size = "sm",
  variant = "default",
}: {
  productId: string;
  label?: string;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const { t, locale } = useT();

  return (
    <Button asChild size={size} variant={variant} className={cn("gap-2", className)}>
      <a
        href={`/go/product/${productId}?l=${locale}`}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackContact(productId, "telegram")}
      >
        <TelegramIcon className="size-4 shrink-0" />
        <span className="min-w-0 truncate">
          {label ?? t("product.contactSeller")}
        </span>
      </a>
    </Button>
  );
}
