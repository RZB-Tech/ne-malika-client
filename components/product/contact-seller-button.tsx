"use client";

import type { ComponentProps } from "react";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { trackContact } from "@/lib/metrika";
import { cn } from "@/lib/utils";

/**
 * Связь с продавцом там, где телеграма магазина под рукой нет — в карточке
 * каталога. Адрес диалога собирает редирект `/go/product/[id]`, поэтому это
 * обычная ссылка: никаких запросов по клику и никаких блокировок попапов.
 * На странице товара, где магазин уже загружен, остаётся `TelegramButton`.
 */
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
        {/* В карточке каталога на телефоне ширины на всю подпись нет — она
            должна аккуратно оборваться многоточием, а не обрезаться краем
            карточки посреди буквы. */}
        <span className="min-w-0 truncate">
          {label ?? t("product.contactSeller")}
        </span>
      </a>
    </Button>
  );
}
