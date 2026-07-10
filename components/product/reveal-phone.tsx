"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useT } from "@/components/providers/i18n-provider";
import { trackContact } from "@/lib/metrika";
import { cn } from "@/lib/utils";

/**
 * Telegram-style "show number": the seller phone is blurred until the buyer
 * clicks it. The click is an intent signal we can later feed into analytics
 * of interested buyers (see the seam in `reveal`). Once revealed the number
 * itself becomes the call action — tapping it hands off to the dialer.
 */
export function RevealPhone({
  phone,
  productId,
  className,
}: {
  phone: string;
  productId: string;
  className?: string;
}) {
  const { t } = useT();
  const [revealed, setRevealed] = useState(false);

  const reveal = () => {
    setRevealed(true);
    // Автоцель Метрики ловит только клик по готовой ссылке `tel:`, а она
    // появляется уже после раскрытия — поэтому сам интерес отмечаем сами.
    trackContact(productId, "phone");
  };

  const rowClassName = cn(
    "group flex items-center gap-2 text-left text-xs text-muted-foreground",
    className,
  );

  if (revealed) {
    return (
      <a
        href={`tel:${phone.replace(/[^\d+]/g, "")}`}
        className={cn(rowClassName, "hover:text-foreground")}
      >
        <Phone className="size-3.5 shrink-0" />
        <span className="tabular text-foreground group-hover:underline">{phone}</span>
      </a>
    );
  }

  // Код страны и первая цифра видны, остальное под блюром до клика.
  const head = phone.slice(0, 6);
  const tail = phone.slice(6);

  return (
    <button
      type="button"
      onClick={reveal}
      aria-label={t("product.showPhone")}
      title={t("product.showPhone")}
      className={cn(rowClassName, "cursor-pointer")}
    >
      <Phone className="size-3.5 shrink-0" />
      <span className="tabular text-foreground">
        {head}
        <span className="select-none blur-[5px]" aria-hidden>
          {tail}
        </span>
      </span>
      <span className="font-medium text-primary group-hover:underline">
        {t("product.showPhone")}
      </span>
    </button>
  );
}
