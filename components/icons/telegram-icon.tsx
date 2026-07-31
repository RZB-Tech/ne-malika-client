import type { SVGProps } from "react";

/**
 * Official Telegram Paper Airplane Icon component.
 * Replaces generic/crooked Lucide paper plane icons with the authentic Telegram paper plane logo.
 */
export function TelegramIcon({
  className = "size-4",
  ...props
}: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3L19.77 4.63c.73-.32 1.42.18 1.15 1.3l-2.7 12.72c-.19.92-.74 1.14-1.5.71l-4.56-3.36-2.2 2.12c-.25.25-.46.46-.92.46z" />
    </svg>
  );
}
