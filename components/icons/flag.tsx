import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * Круглые флаги для переключателя языка — вместо эмодзи: те рисуются шрифтом
 * системы (на Windows их вовсе нет, вместо флага показываются буквы кода) и
 * не бывают круглыми.
 *
 * Обрезка в круг — на самом <svg>: у корня SVG overflow: hidden, поэтому
 * border-radius режет содержимое. Так обходимся без <clipPath>, а значит и без
 * id, которые дублировались бы на каждый экземпляр в списке.
 */

const RU = (
  <>
    <rect width="24" height="8" fill="#fff" />
    <rect y="8" width="24" height="8" fill="#0039a6" />
    <rect y="16" width="24" height="8" fill="#d52b1e" />
  </>
);

// Узбекистан: полосы, полумесяц и звёзды. Полумесяц смещён к центру — по краям
// круглой обрезки его бы срезало.
const UZ = (
  <>
    <rect width="24" height="24" fill="#fff" />
    <rect width="24" height="7.6" fill="#0099b5" />
    <rect y="7.6" width="24" height="0.9" fill="#ce1126" />
    <rect y="15.5" width="24" height="0.9" fill="#ce1126" />
    <rect y="16.4" width="24" height="7.6" fill="#1eb53a" />
    {/* Полумесяц = белый круг минус круг цвета полосы. */}
    <circle cx="7.5" cy="5" r="2.2" fill="#fff" />
    <circle cx="8.6" cy="4.7" r="1.9" fill="#0099b5" />
    {/* Звёзды на таком размере читаются только как точки. */}
    <circle cx="11.2" cy="3.6" r="0.45" fill="#fff" />
    <circle cx="11.2" cy="6.2" r="0.45" fill="#fff" />
    <circle cx="13.2" cy="4.9" r="0.45" fill="#fff" />
  </>
);

/** Оба узбекских варианта — один язык в двух письменностях, флаг общий. */
const BY_LOCALE: Record<Locale, React.ReactNode> = {
  ru: RU,
  "uz-Latn": UZ,
  "uz-Cyrl": UZ,
};

export function Flag({
  locale,
  className,
}: {
  locale: Locale;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      // Кольцо даёт границу белой полосе на светлом фоне — без него флаг
      // выглядит обрезанным.
      className={cn(
        "size-4.5 shrink-0 rounded-full ring-1 ring-foreground/15",
        className,
      )}
    >
      {BY_LOCALE[locale]}
    </svg>
  );
}
