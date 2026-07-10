"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut } from "lucide-react";
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

export function UserMenu() {
  const { t } = useT();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();

  if (!user) return null;

  // `telegramPhoto`/`telegramUsername` are typed as generic nullable objects in
  // the generated schema but are really strings (or null) coming from Telegram.
  const photo = user.telegramPhoto as string | null;
  const username = user.telegramUsername as string | null;
  const cabinetHref = isAdmin ? "/admin" : "/seller";
  const cabinetLabel = isAdmin ? t("nav.admin") : t("nav.sellerCabinet");

  const onLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch {
      toast.error("Не удалось выйти");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Avatar>
          {photo ? <AvatarImage src={photo} alt={user.fullname} /> : null}
          <AvatarFallback>{initials(user.fullname)}</AvatarFallback>
        </Avatar>
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
          <Link href={cabinetHref}>
            <LayoutDashboard className="size-4" />
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
