"use client";

import { LayoutDashboard, Package, PlusCircle, Store } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardShell, type NavItem } from "@/components/layout/dashboard-shell";
import { useT } from "@/components/providers/i18n-provider";
import { useSellerShopsControllerList } from "@/lib/api/generated/endpoints/shops-seller/shops-seller";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import type { ShopRow } from "@/lib/api/types";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  // Гард снаружи: иначе хуки ниже успеют сходить за данными магазина от анонима.
  return (
    <RequireRole role="seller">
      <SellerLayoutInner>{children}</SellerLayoutInner>
    </RequireRole>
  );
}

function SellerLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { data } = useSellerShopsControllerList({
    query: { select: (raw) => raw as unknown as ShopRow[] },
  });
  const shop = data?.[0];

  const items: NavItem[] = [
    { href: "/seller", label: t("seller.nav.dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/seller/products", label: t("seller.nav.products"), icon: Package },
    { href: "/seller/products/new", label: t("seller.nav.addProduct"), icon: PlusCircle },
    { href: "/seller/profile", label: t("seller.nav.profile"), icon: Store },
  ];

  const name = shop?.name ?? "Мой магазин";
  const hue = shop ? hueFromId(shop.id) : 262;

  const badge = (
    <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-card p-3">
      <StoreAvatar
        name={name}
        hue={hue}
        src={photoUrl(shop?.photo)}
        className="size-9 rounded-lg text-sm"
      />
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">
          {shop ? t("seller.cabinet") : "Магазин не создан"}
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
