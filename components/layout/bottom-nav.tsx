"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart, Home, LayoutGrid, UserRound } from "@/components/icons";
import { LogoMark } from "@/components/shared/logo";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useFavorites } from "@/components/providers/favorites-provider";
import { openCatalog } from "./catalog-bus";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { t } = useT();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isHydrated } = useAuth();
  const { count: favorites } = useFavorites();
  const favoritesActive = pathname === "/account" && searchParams.get("tab") === "favorites";

  return (
    <nav
      aria-label={t("common.menu")}
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 rounded-[1.75rem] bg-card shadow-[0_8px_32px_-8px_rgba(0,0,0,0.22)] md:hidden"
    >
      <div className="grid h-[64px] grid-cols-4 items-stretch px-1">
        <Link
          href="/"
          aria-label={`neMalika — ${t("nav.home")}`}
          aria-current={pathname === "/" ? "page" : undefined}
          className={cn(ITEM_CLASS, pathname === "/" && "font-semibold text-primary")}
        >
          <LogoMark
            className={cn("h-6 w-9", pathname === "/" ? "text-primary" : "text-muted-foreground")}
          />
          <span className="max-w-full truncate">{t("nav.home")}</span>
        </Link>
        <Item icon={LayoutGrid} label={t("nav.catalog")} onClick={openCatalog} />
        <Item
          href="/account?tab=favorites"
          icon={Heart}
          label={t("account.tabs.favorites")}
          count={favorites}
          active={favoritesActive}
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
  "relative flex min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-0.5 text-[10px] leading-none text-muted-foreground transition-colors outline-none focus-visible:ring-2 focus-visible:ring-primary";

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
