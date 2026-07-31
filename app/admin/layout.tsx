"use client";

import {
  BarChart3,
  Flag,
  Package,
  Settings,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import {
  DashboardShell,
  type NavItem,
  type ShellBrand,
} from "@/components/layout/dashboard-shell";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </RequireRole>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { user } = useAuth();

  const items: NavItem[] = [
    { href: "/admin", label: t("admin.nav.dashboard"), icon: BarChart3, exact: true },
    { href: "/admin/reports", label: "Жалобы", icon: Flag },
    { href: "/admin/sellers", label: t("admin.nav.sellers"), icon: Store },
    { href: "/admin/users", label: "Пользователи", icon: Users },
    { href: "/admin/products", label: t("admin.nav.products"), icon: Package },
    { href: "/admin/ai-review", label: "Проверка ИИ", icon: Sparkles },
    { href: "/admin/settings", label: t("admin.nav.settings"), icon: Settings },
  ];

  const brand: ShellBrand = {
    avatar: (
      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ShieldCheck className="size-4" />
      </div>
    ),
    title: user?.fullname ?? t("admin.panel"),
    subtitle: t("admin.panel"),
  };

  return (
    <DashboardShell
      items={items}
      sectionLabel={t("admin.panel")}
      brand={brand}
    >
      {children}
    </DashboardShell>
  );
}
