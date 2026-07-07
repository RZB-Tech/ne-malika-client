"use client";

import { LayoutDashboard, Package, PlusCircle, Store } from "lucide-react";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { useT } from "@/components/providers/i18n-provider";
import { getStore, CURRENT_STORE_ID, storeProductCount } from "@/lib/data";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const store = getStore(CURRENT_STORE_ID)!;

  const items: NavItem[] = [
    { href: "/seller", label: t("seller.nav.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/seller/products", label: t("seller.nav.products"), icon: Package },
    { href: "/seller/products/new", label: t("seller.nav.addProduct"), icon: PlusCircle },
    { href: "/seller/profile", label: t("seller.nav.profile"), icon: Store },
  ];

  const badge = (
    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-card p-3">
      <span
        className="grid size-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
        style={{ background: `oklch(0.55 0.17 ${store.logoHue})` }}
      >
        {store.name.slice(0, 1)}
      </span>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{store.name}</div>
        <div className="text-xs text-muted-foreground tabular">
          {storeProductCount(store.id)} {t("common.goods")}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardShell items={items} sectionLabel={t("seller.cabinet")} brandBadge={badge}>
      {children}
    </DashboardShell>
  );
}
