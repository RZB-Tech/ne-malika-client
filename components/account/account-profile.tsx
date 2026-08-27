"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, Store, UserRound } from "@/components/icons";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";

export function AccountProfile() {
  const { t } = useT();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isSeller, logout } = useAuth();

  if (!isAuthenticated || !user) {
    return (
      <Card className="flex flex-col items-center px-6 py-14 text-center">
        <UserRound className="size-10 text-muted-foreground/60" />
        <h2 className="mt-4 font-heading text-lg font-semibold">
          {t("account.profile.guestTitle")}
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {t("account.profile.guestText")}
        </p>
        <LoginDialog redirectTo={null}>
          <Button size="lg" className="mt-6 gap-2">
            <TelegramIcon className="size-4" />
            {t("auth.telegramLogin")}
          </Button>
        </LoginDialog>
      </Card>
    );
  }

  const photo = user.telegramPhoto as string | null;
  const username = user.telegramUsername as string | null;
  const phone = user.phoneNumber as string | null;

  const onLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch {
      toast.error(t("common.logoutFailed"));
    }
  };

  const rows = [
    { label: t("account.profile.name"), value: user.fullname },
    { label: t("account.profile.username"), value: username ? `@${username}` : "—" },
    {
      label: t("account.profile.phone"),
      value: phone ?? t("account.profile.phoneMissing"),
    },
    {
      label: t("account.profile.role"),
      value: isAdmin
        ? t("account.profile.roleAdmin")
        : isSeller
          ? t("account.profile.roleSeller")
          : t("account.profile.roleUser"),
    },
  ];

  return (
    <Card className="max-w-xl p-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          {photo ? <AvatarImage src={photo} alt={user.fullname} /> : null}
          <AvatarFallback>{user.fullname.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-heading text-lg font-semibold">{user.fullname}</p>
          {username && <p className="truncate text-sm text-muted-foreground">@{username}</p>}
        </div>
      </div>

      <Separator className="my-5" />

      <dl className="grid gap-3 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="truncate font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button asChild variant="outline" className="gap-2">
          <Link href={isAdmin ? "/admin" : isSeller ? "/seller" : "/seller/profile"}>
            {isSeller || isAdmin ? (
              <LayoutDashboard className="size-4" />
            ) : (
              <Store className="size-4" />
            )}
            {isAdmin ? t("nav.admin") : isSeller ? t("nav.sellerCabinet") : t("nav.becomeSeller")}
          </Link>
        </Button>
        <Button variant="ghost" className="gap-2 text-destructive" onClick={onLogout}>
          <LogOut className="size-4" />
          {t("nav.logout")}
        </Button>
      </div>
    </Card>
  );
}
