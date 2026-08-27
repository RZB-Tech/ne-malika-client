"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LogIn } from "@/components/icons";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import type { UserRole } from "@/lib/api/types";

export function RequireRole({
  role,
  children,
}: {
  role: UserRole | UserRole[];
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isHydrated, refreshSession } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const refreshTried = useRef(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const roles = Array.isArray(role) ? role : [role];
  const allowed = Boolean(user && roles.includes(user.role as UserRole));

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    if (allowed) return;

    if (!refreshTried.current) {
      refreshTried.current = true;
      void refreshSession().finally(() => setRefreshDone(true));
      return;
    }
    if (refreshDone) router.replace("/");
  }, [isHydrated, isAuthenticated, allowed, refreshDone, refreshSession, router]);

  if (isHydrated && !isAuthenticated) return <LoginWall next={pathname} />;

  if (!isHydrated || !allowed) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return <>{children}</>;
}

function LoginWall({ next }: { next: string }) {
  const { t } = useT();

  return (
    <div className="p-6">
      <Card className="mx-auto flex max-w-md flex-col items-center gap-4 py-14 text-center">
        <LogIn className="size-10 text-muted-foreground/50" />
        <div>
          <h2 className="font-heading text-lg font-semibold">
            {t("auth.needLoginTitle")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("auth.needLoginText")}
          </p>
        </div>
        <LoginDialog redirectTo={next}>
          <Button className="gap-2">
            <LogIn className="size-4" />
            {t("nav.login")}
          </Button>
        </LoginDialog>
      </Card>
    </div>
  );
}
