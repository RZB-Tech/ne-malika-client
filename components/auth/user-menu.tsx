"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { History, LayoutDashboard, LogOut, Store } from "@/components/icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function UserMenu({ trigger }: { trigger?: ReactNode } = {}) {
  const { t } = useT();
  const router = useRouter();
  const { user, isAdmin, isSeller, logout } = useAuth();

  if (!user) return null;

  const photo = user.telegramPhoto as string | null;
  const username = user.telegramUsername as string | null;
  // Покупателю без магазина показывать пустой кабинет незачем: там его ждала
  // карточка «магазина нет» с кнопкой на эту же форму — лишний клик на пути,
  // где и так отваливаются.
  const cabinetHref = isAdmin
    ? "/admin"
    : isSeller
      ? "/seller"
      : "/seller/profile";
  const cabinetLabel = isAdmin
    ? t("nav.admin")
    : isSeller
      ? t("nav.sellerCabinet")
      : t("nav.becomeSeller");

  const onLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch {
      toast.error(t("common.logoutFailed"));
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild={Boolean(trigger)}
        className={cn(
          !trigger &&
            "ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        {trigger ?? (
          <Avatar>
            {photo ? <AvatarImage src={photo} alt={user.fullname} /> : null}
            <AvatarFallback>{initials(user.fullname)}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{user.fullname}</span>
          {username ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              @{username}
            </span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <History className="size-4" />
            {t("nav.account")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={cabinetHref}>
            {isSeller || isAdmin ? (
              <LayoutDashboard className="size-4" />
            ) : (
              <Store className="size-4" />
            )}
            {cabinetLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLogout}>
          <LogOut className="size-4" />
          {t("nav.logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
