"use client";

import { BarChart3, Package, Settings, Users } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/providers/i18n-provider";
import { products, stores } from "@/lib/data";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { t } = useT();

  const pendingProducts = products.filter((p) => p.moderation === "moderation").length;
  const pendingSellers = stores.filter((s) => s.status === "pending").length;

  const items: NavItem[] = [
    { href: "/admin", label: t("admin.nav.dashboard"), icon: BarChart3, exact: true },
    { href: "/admin/sellers", label: t("admin.nav.sellers"), icon: Users },
    { href: "/admin/products", label: t("admin.nav.products"), icon: Package },
    { href: "/admin/settings", label: t("admin.nav.settings"), icon: Settings },
  ];

  const badge = (
    <div className="rounded-xl border border-sidebar-border bg-card p-3 text-xs">
      <div className="flex items-center justify-between py-1">
        <span className="text-muted-foreground">{t("moderation.moderation")}</span>
        <Badge variant="secondary" className="tabular">{pendingProducts}</Badge>
      </div>
      <div className="flex items-center justify-between py-1">
        <span className="text-muted-foreground">{t("admin.sellers.pending")}</span>
        <Badge variant="secondary" className="tabular">{pendingSellers}</Badge>
      </div>
    </div>
  );

  return (
    <DashboardShell items={items} sectionLabel={t("admin.panel")} brandBadge={badge}>
      {children}
    </DashboardShell>
  );
}
