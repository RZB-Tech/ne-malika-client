"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/api/auth";
import type { UserRole } from "@/lib/api/types";

/**
 * Закрывает раздел от чужих. Проверка только клиентская: сессия лежит в
 * localStorage, серверу она недоступна, поэтому middleware тут бессилен.
 *
 * Это защита интерфейса, а не данных. Настоящий барьер — guard'ы NestJS на
 * каждом эндпоинте: даже открыв разметку кабинета, чужих товаров не увидишь.
 */
export function RequireRole({
  role,
  children,
}: {
  /** Одна роль или список: в кабинет продавца пускаем и покупателя — создать магазин. */
  role: UserRole | UserRole[];
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isHydrated, refreshSession } = useAuth();
  const router = useRouter();
  /** Одна попытка перевыпустить токен, прежде чем выставлять за дверь. */
  const refreshTried = useRef(false);
  const [refreshDone, setRefreshDone] = useState(false);

  const roles = Array.isArray(role) ? role : [role];
  const allowed = Boolean(user && roles.includes(user.role as UserRole));

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated) {
      router.replace("/");
      return;
    }
    if (allowed) return;

    if (!refreshTried.current) {
      refreshTried.current = true;
      void refreshSession().finally(() => setRefreshDone(true));
      return;
    }
    if (refreshDone) router.replace("/");
  }, [isHydrated, isAuthenticated, allowed, refreshDone, refreshSession, router]);

  if (!isHydrated || !isAuthenticated || !allowed) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return <>{children}</>;
}
