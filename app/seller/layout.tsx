"use client";

import {
  BarChart3,
  ImageIcon,
  LayoutDashboard,
  Package,
  Star,
  Store,
  Wallet,
} from "@/components/icons";
import { RequireRole } from "@/components/auth/require-role";
import { DashboardShell, type NavItem, type ShellBrand } from "@/components/layout/dashboard-shell";
import { useT } from "@/components/providers/i18n-provider";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { AddProductDialog } from "@/components/seller/add-product-dialog";
import { useSellerSubscription } from "@/lib/api/subscription";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role={["user", "seller"]}>
      <SellerLayoutInner>{children}</SellerLayoutInner>
    </RequireRole>
  );
}

function SellerLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { shop, subscription } = useSellerSubscription();

  const items: NavItem[] = [
    { href: "/seller", label: t("seller.nav.dashboard"), icon: LayoutDashboard, exact: true },
    ...(shop
      ? [
          { href: "/seller/products", label: t("seller.nav.products"), icon: Package },
          { href: "/seller/analytics", label: t("seller.nav.analytics"), icon: BarChart3 },
          { href: "/seller/reviews", label: t("seller.nav.reviews"), icon: Star },
          ...(subscription && subscription.bannerSlots > 0
            ? [{ href: "/seller/banner", label: t("seller.nav.banner"), icon: ImageIcon }]
            : []),
          { href: "/seller/subscription", label: t("seller.nav.subscription"), icon: Wallet },
        ]
      : []),
    { href: "/seller/profile", label: t("seller.nav.profile"), icon: Store },
  ];

  const name = shop?.name ?? t("seller.shop.mine");

  const brand: ShellBrand = {
    avatar: (
      <StoreAvatar
        name={name}
        hue={shop ? hueFromId(shop.id) : 262}
        src={photoUrl(shop?.photo)}
        className="size-8 shrink-0 rounded-lg text-xs"
      />
    ),
    title: name,
    subtitle: shop ? t("seller.cabinet") : t("seller.shop.notCreated"),
  };

  return (
    <DashboardShell items={items} sectionLabel={t("seller.cabinet")} brand={brand}>
      {children}
      <AddProductDialog />
    </DashboardShell>
  );
}
