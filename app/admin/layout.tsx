"use client";

import { BarChart3, Flag, Package, Settings, Users } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { useT } from "@/components/providers/i18n-provider";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="admin">
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </RequireRole>
  );
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();

  const items: NavItem[] = [
    { href: "/admin", label: t("admin.nav.dashboard"), icon: BarChart3, exact: true },
    { href: "/admin/reports", label: "Жалобы", icon: Flag },
    { href: "/admin/sellers", label: t("admin.nav.sellers"), icon: Users },
    { href: "/admin/products", label: t("admin.nav.products"), icon: Package },
    { href: "/admin/settings", label: t("admin.nav.settings"), icon: Settings },
  ];

  const badge = (
    <div className="rounded-xl border border-sidebar-border bg-card p-3 text-xs text-muted-foreground">
      {t("admin.panel")}
    </div>
  );

  return (
    <DashboardShell items={items} sectionLabel={t("admin.panel")} brandBadge={badge}>
      {children}
    </DashboardShell>
  );
}
