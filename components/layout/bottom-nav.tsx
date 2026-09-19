"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Home, LayoutGrid, Scale, UserRound } from "@/components/icons";
import { LogoMark } from "@/components/shared/logo";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useFavorites } from "@/components/providers/favorites-provider";
import { useCompare } from "@/components/providers/compare-provider";
import { openCatalog } from "./catalog-bus";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isHydrated } = useAuth();
  const { count: favorites } = useFavorites();
  const { items: compared } = useCompare();
  const favoritesActive = pathname === "/account" && searchParams.get("tab") === "favorites";

  return (
    <nav
      aria-label={t("common.menu")}
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-[1.75rem] bg-card shadow-[0_8px_32px_-8px_rgba(0,0,0,0.22)] md:hidden"
    >
      <div className="relative grid h-[68px] grid-cols-5 items-stretch px-1">
        <Item icon={LayoutGrid} label={t("nav.catalog")} onClick={openCatalog} />
        <Item
          href="/account?tab=favorites"
          icon={Heart}
          label={t("account.tabs.favorites")}
          count={favorites}
          active={favoritesActive}
        />
        <Link
          href="/"
          aria-label={`neMalika — ${t("nav.home")}`}
          aria-current={pathname === "/" ? "page" : undefined}
          className="relative flex min-w-0 flex-col items-center justify-end pb-3 text-[10px] leading-none outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
        >
          <span className="absolute -top-7 flex size-[76px] items-center justify-center rounded-full bg-card">
            <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_4px_14px_color-mix(in_srgb,var(--primary)_40%,transparent)] transition-transform active:scale-95">
              <LogoMark className="h-6 w-9" />
            </span>
          </span>
          <span
            className={cn(
              "relative",
              pathname === "/" ? "font-semibold text-primary" : "text-muted-foreground",
            )}
          >
            {t("nav.home")}
          </span>
        </Link>
        <Item
          href="/compare"
          icon={Scale}
          label={t("nav.compare")}
          count={compared.length}
          active={pathname === "/compare"}
        />

        {isHydrated && !isAuthenticated ? (
          <LoginDialog>
            <button type="button" className={ITEM_CLASS}>
              <Body icon={UserRound} label={t("nav.login")} />
            </button>
          </LoginDialog>
        ) : (
          <Item
            href="/account"
            icon={UserRound}
            label={t("nav.cabinet")}
            active={pathname.startsWith("/account") && !favoritesActive}
          />
        )}
      </div>
    </nav>
  );
}

const ITEM_CLASS =
  "relative flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-0.5 pt-1 text-[9px] min-[360px]:text-[10px] leading-none text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary";

function Item({
  href,
  icon,
  label,
  count,
  active,
  onClick,
}: {
  href?: string;
  icon: typeof Home;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = cn(
    ITEM_CLASS,
    active &&
      "font-semibold text-primary before:absolute before:top-2 before:h-0.5 before:w-3 before:rounded-full before:bg-primary",
  );
  const body = <Body icon={icon} label={label} count={count} />;

  return href ? (
    <Link href={href} className={className} aria-current={active ? "page" : undefined}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

function Body({ icon: Icon, label, count }: { icon: typeof Home; label: string; count?: number }) {
  return (
    <>
      <span className="relative">
        <Icon className="size-[1.35rem]" />
        {count !== undefined && count > 0 && (
          <span className="absolute -top-1 -right-2 flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      <span className="max-w-full truncate">{label}</span>
    </>
  );
}
