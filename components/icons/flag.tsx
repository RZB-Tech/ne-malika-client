import type { Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";


const RU = (
  <>
    <rect width="24" height="8" fill="#fff" />
    <rect y="8" width="24" height="8" fill="#0039a6" />
    <rect y="16" width="24" height="8" fill="#d52b1e" />
  </>
);

const UZ = (
  <>
    <rect width="24" height="24" fill="#fff" />
    <rect width="24" height="7.6" fill="#0099b5" />
    <rect y="7.6" width="24" height="0.9" fill="#ce1126" />
    <rect y="15.5" width="24" height="0.9" fill="#ce1126" />
    <rect y="16.4" width="24" height="7.6" fill="#1eb53a" />
    <circle cx="7.5" cy="5" r="2.2" fill="#fff" />
    <circle cx="8.6" cy="4.7" r="1.9" fill="#0099b5" />
    <circle cx="11.2" cy="3.6" r="0.45" fill="#fff" />
    <circle cx="11.2" cy="6.2" r="0.45" fill="#fff" />
    <circle cx="13.2" cy="4.9" r="0.45" fill="#fff" />
  </>
);

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
      className={cn(
        "size-4.5 shrink-0 rounded-full ring-1 ring-foreground/15",
        className,
      )}
    >
      {BY_LOCALE[locale]}
    </svg>
  );
}
