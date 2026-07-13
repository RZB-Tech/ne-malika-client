import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Brand lockup (pixel-grid mark + wordmark), inlined so it inherits the
 * surrounding text colour: brand blue on light/dark chrome, white on the dark
 * auth panel. The raw asset lives in `public/logo-primary.svg`.
 */
const MARK = (
  <g clipPath="url(#logo-mark-clip)">
    <rect x="143" width="10" height="10" />
    <rect x="154" width="10" height="10" />
    <rect x="143" y="11" width="10" height="10" />
    <rect x="154" y="11" width="10" height="10" />
    <rect x="143" y="22" width="10" height="10" />
    <rect x="154" y="22" width="10" height="10" />
    <rect x="143" y="33" width="10" height="10" />
    <rect x="154" y="33" width="10" height="10" />
    <rect x="143" y="44" width="10" height="10" />
    <rect x="154" y="44" width="10" height="10" />
    <rect x="143" y="55" width="10" height="10" />
    <rect x="154" y="55" width="10" height="10" />
    <rect x="143" y="66" width="10" height="10" />
    <rect x="154" y="66" width="10" height="10" />
    <rect x="143" y="77" width="10" height="10" />
    <rect x="154" y="77" width="10" height="10" />
    <rect x="143" y="88" width="10" height="10" />
    <rect x="154" y="88" width="10" height="10" />
    <rect x="143" y="99" width="10" height="10" />
    <rect x="154" y="99" width="10" height="10" />
    <rect x="132" y="66" width="10" height="10" />
    <rect x="132" y="77" width="10" height="10" />
    <rect x="132" y="88" width="10" height="10" />
    <rect x="121" y="55" width="10" height="10" />
    <rect x="121" y="66" width="10" height="10" />
    <rect x="121" y="77" width="10" height="10" />
    <rect x="110" y="44" width="10" height="10" />
    <rect x="110" y="55" width="10" height="10" />
    <rect x="110" y="66" width="10" height="10" />
    <rect x="99" y="33" width="10" height="10" />
    <rect x="99" y="44" width="10" height="10" />
    <rect x="99" y="55" width="10" height="10" />
    <rect x="88" y="22" width="10" height="10" />
    <rect x="88" y="33" width="10" height="10" />
    <rect x="88" y="44" width="10" height="10" />
    <rect opacity="0.9" x="77" y="11" width="10" height="10" />
    <rect opacity="0.9" x="77" y="22" width="10" height="10" />
    <rect opacity="0.9" x="77" y="33" width="10" height="10" />
    <rect opacity="0.9" x="77" y="44" width="10" height="10" />
    <rect opacity="0.9" x="77" y="55" width="10" height="10" />
    <rect opacity="0.9" x="77" y="66" width="10" height="10" />
    <rect opacity="0.9" x="77" y="77" width="10" height="10" />
    <rect opacity="0.9" x="77" y="88" width="10" height="10" />
    <rect opacity="0.9" x="77" y="99" width="10" height="10" />
    <rect x="66" width="10" height="10" />
    <rect opacity="0.8" x="66" y="22" width="10" height="10" />
    <rect opacity="0.8" x="66" y="44" width="10" height="10" />
    <rect opacity="0.8" x="66" y="66" width="10" height="10" />
    <rect x="66" y="88" width="10" height="10" />
    <rect opacity="0.8" x="66" y="99" width="10" height="10" />
    <rect x="55" y="11" width="10" height="10" />
    <rect opacity="0.5" x="55" y="33" width="10" height="10" />
    <rect opacity="0.8" x="55" y="55" width="10" height="10" />
    <rect x="55" y="77" width="10" height="10" />
    <rect x="44" width="10" height="10" />
    <rect x="44" y="22" width="10" height="10" />
    <rect opacity="0.7" x="44" y="44" width="10" height="10" />
    <rect opacity="0.44" x="44" y="66" width="10" height="10" />
    <rect x="44" y="99" width="10" height="10" />
    <rect opacity="0.7" x="22" width="10" height="10" />
    <rect x="22" y="33" width="10" height="10" />
    <rect x="22" y="55" width="10" height="10" />
    <rect x="22" y="66" width="10" height="10" />
    <rect y="11" width="10" height="10" />
    <rect opacity="0.5" y="56" width="10" height="10" />
  </g>
);

const MARK_CLIP = (
  <defs>
    <clipPath id="logo-mark-clip">
      <rect width="164" height="109" fill="white" />
    </clipPath>
  </defs>
);

const WORDMARK_PATH =
  "M182.264 110V32.24H253.868V46.604H196.628V63.884H242.636V78.356H196.628V95.636H253.868V110H182.264ZM262.31 110V32.24H277.97L306.158 65.828L334.238 32.24H350.006V110H335.642V52.976L306.158 88.076L276.566 53.084V110H262.31ZM362.721 110V47.252C362.721 44.516 363.405 42.032 364.773 39.8C366.141 37.496 367.941 35.66 370.173 34.292C372.477 32.924 374.997 32.24 377.733 32.24H425.361C428.097 32.24 430.617 32.924 432.921 34.292C435.225 35.66 437.061 37.496 438.429 39.8C439.797 42.032 440.481 44.516 440.481 47.252V110H426.117V83.864H376.977V110H362.721ZM376.977 69.608H426.117V47.9C426.117 47.54 425.973 47.252 425.685 47.036C425.397 46.748 425.073 46.604 424.713 46.604H378.273C377.913 46.604 377.589 46.748 377.301 47.036C377.085 47.252 376.977 47.54 376.977 47.9V69.608ZM452.894 110V32.132H467.15V95.636H530.654V110H452.894ZM535.438 110V32.24H549.586V110H535.438ZM560.894 110V32.24H575.258V63.884H593.51L620.078 32.24H635.63V36.344L606.47 71.12L635.738 105.896V110H620.078L593.51 78.356H575.258V110H560.894ZM644.323 110V47.252C644.323 44.516 645.007 42.032 646.375 39.8C647.743 37.496 649.543 35.66 651.775 34.292C654.079 32.924 656.599 32.24 659.335 32.24H706.963C709.699 32.24 712.219 32.924 714.523 34.292C716.827 35.66 718.663 37.496 720.031 39.8C721.399 42.032 722.083 44.516 722.083 47.252V110H707.719V83.864H658.579V110H644.323ZM658.579 69.608H707.719V47.9C707.719 47.54 707.575 47.252 707.287 47.036C706.999 46.748 706.675 46.604 706.315 46.604H659.875C659.515 46.604 659.191 46.748 658.903 47.036C658.687 47.252 658.579 47.54 658.579 47.9V69.608Z";

/** Mark only (no wordmark) — for tight spots like avatars or square badges. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 164 109"
      fill="currentColor"
      aria-hidden
      className={cn("h-6 w-auto", className)}
    >
      {MARK}
      {MARK_CLIP}
    </svg>
  );
}

/** Brand mark + wordmark, linking home. */
export function Logo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label="neMalika"
      className={cn(
        "inline-flex items-center text-primary transition-opacity hover:opacity-80",
        className,
      )}
    >
      {showText ? (
        <svg viewBox="0 0 729 110" fill="currentColor" aria-hidden className="h-6 w-auto">
          {MARK}
          <path d={WORDMARK_PATH} />
          {MARK_CLIP}
        </svg>
      ) : (
        <LogoMark />
      )}
    </Link>
  );
}
