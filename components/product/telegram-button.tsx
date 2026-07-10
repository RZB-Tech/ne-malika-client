"use client";

import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { trackContact } from "@/lib/metrika";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function buildTelegramUrl(
  username: string,
  opts?: { productName?: string; productId?: string; greeting?: string },
) {
  const base = `https://t.me/${username.replace(/^@/, "")}`;
  if (!opts?.productName) return base;
  const lines = [
    opts.greeting ?? "",
    "",
    opts.productName,
    opts.productId ? `ID ${opts.productId}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return `${base}?text=${encodeURIComponent(lines)}`;
}

export function TelegramButton({
  username,
  productName,
  productId,
  label,
  className,
  size = "lg",
  variant = "default",
  ...rest
}: {
  username: string;
  productName?: string;
  productId?: string;
  label?: string;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const { t } = useT();
  const url = buildTelegramUrl(username, {
    productName,
    productId,
    greeting: t("product.telegramGreeting"),
  });

  return (
    <Button
      asChild
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
      {...rest}
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        // Кнопка магазина живёт без товара — привязывать такой переход не к чему.
        onClick={() => productId && trackContact(productId, "telegram")}
      >
        <Send className="size-4" />
        {label ?? t("product.contactSeller")}
      </a>
    </Button>
  );
}
