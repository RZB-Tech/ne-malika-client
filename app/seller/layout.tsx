"use client";

import { LayoutDashboard, Package, PlusCircle, Store } from "lucide-react";
import { RequireRole } from "@/components/auth/require-role";
import {
  DashboardShell,
  type NavItem,
  type ShellBrand,
} from "@/components/layout/dashboard-shell";
import { useT } from "@/components/providers/i18n-provider";
import { StoreAvatar } from "@/components/shared/store-avatar";
import { useSellerShop } from "@/lib/api/seller";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  // Гард снаружи: иначе хуки ниже успеют сходить за данными магазина от анонима.
  // Покупателя пускаем — этот раздел и есть путь «стать продавцом»: он создаёт
  // здесь магазин, и роль меняется сама.
  return (
    <RequireRole role={["user", "seller"]}>
      <SellerLayoutInner>{children}</SellerLayoutInner>
    </RequireRole>
  );
}

function SellerLayoutInner({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const { shop } = useSellerShop();

  // Пока магазина нет, разделы товаров ведут в тупик — оставляем только обзор
  // и форму магазина.
  const items: NavItem[] = [
    { href: "/seller", label: t("seller.nav.dashboard"), icon: LayoutDashboard, exact: true },
    ...(shop
      ? [
          { href: "/seller/products", label: t("seller.nav.products"), icon: Package },
          { href: "/seller/products/new", label: t("seller.nav.addProduct"), icon: PlusCircle },
        ]
      : []),
    { href: "/seller/profile", label: t("seller.nav.profile"), icon: Store },
  ];

  const name = shop?.name ?? "Мой магазин";

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
    subtitle: shop ? t("seller.cabinet") : "Магазин не создан",
  };

  return (
    <DashboardShell
      items={items}
      sectionLabel={t("seller.cabinet")}
      brand={brand}
    >
      {children}
    </DashboardShell>
  );
}
