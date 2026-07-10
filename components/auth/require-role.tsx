"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/api/auth";

type Role = "seller" | "admin";

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
  role: Role;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, isSeller, isAdmin } = useAuth();
  const router = useRouter();

  const allowed = role === "admin" ? isAdmin : isSeller;

  useEffect(() => {
    // До гидратации состояние всегда «разлогинен» — редиректить рано.
    if (!isHydrated) return;
    if (!isAuthenticated || !allowed) router.replace("/");
  }, [isHydrated, isAuthenticated, allowed, router]);

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
