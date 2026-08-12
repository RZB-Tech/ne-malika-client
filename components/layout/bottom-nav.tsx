"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Heart,
  Home,
  LayoutGrid,
  MessageSquare,
  Scale,
  UserRound,
} from "@/components/icons";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useFavorites } from "@/lib/favorites/use-favorites";
import { useCompare } from "@/lib/compare/use-compare";
import { useChatUnread } from "@/lib/api/chats";
import { openCatalog } from "./catalog-bus";
import { cn } from "@/lib/utils";

/**
 * Нижняя панель навигации — только на телефоне.
 *
 * На узком экране в шапку помещаются знак, поиск и вход, и всё. Остальное —
 * каталог, избранное, сравнение — уезжает сюда, к большому пальцу: до низа
 * экрана рука дотягивается, до верха на шестидюймовом телефоне уже нет.
 *
 * Панель фиксированная и не прячется при прокрутке: она заменяет собой меню, а
 * меню, которое надо сначала найти, — уже не меню.
 */
export function BottomNav() {
  const { t } = useT();
  const pathname = usePathname();
  const { isAuthenticated, isHydrated } = useAuth();
  const { count: favorites } = useFavorites();
  const { items: compared } = useCompare();
  const unread = useChatUnread().data?.buyer ?? 0;

  return (
    <nav
      aria-label={t("common.menu")}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="flex h-14 items-stretch">
        <Item
          href="/"
          icon={Home}
          label={t("nav.home")}
          active={pathname === "/"}
        />
        <Item icon={LayoutGrid} label={t("nav.catalog")} onClick={openCatalog} />
        <Item
          href="/messages"
          icon={MessageSquare}
          label={t("nav.messagesShort")}
          count={unread}
          active={pathname === "/messages"}
        />
        <Item
          href="/account?tab=favorites"
          icon={Heart}
          label={t("account.tabs.favorites")}
          count={favorites}
        />
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
            active={pathname.startsWith("/account")}
          />
        )}
      </div>
    </nav>
  );
}

const ITEM_CLASS =
  "flex flex-1 flex-col items-center justify-center gap-1 text-[11px] leading-none text-muted-foreground transition-colors outline-none focus-visible:bg-muted";

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
  const className = cn(ITEM_CLASS, active && "text-foreground");
  const body = <Body icon={icon} label={label} count={count} />;

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}

function Body({
  icon: Icon,
  label,
  count,
}: {
  icon: typeof Home;
  label: string;
  count?: number;
}) {
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
