"use client";

import {
  BarChart3,
  Flag,
  ImageIcon,
  Package,
  Settings,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Users,
  Wallet,
} from "@/components/icons";
import { RequireRole } from "@/components/auth/require-role";
import {
  DashboardShell,
  type NavGroup,
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

  const groups: NavGroup[] = [
    {
      label: t("admin.nav.groupOverview"),
      items: [{ href: "/admin", label: t("admin.nav.dashboard"), icon: BarChart3, exact: true }],
    },
    {
      label: t("admin.nav.groupModeration"),
      items: [
        { href: "/admin/reports", label: t("admin.nav.reports"), icon: Flag },
        { href: "/admin/reviews", label: t("admin.nav.reviews"), icon: Star },
        {
          href: "/admin/ai-review",
          label: t("admin.nav.ai"),
          icon: Sparkles,
          items: [
            { href: "/admin/ai-review", label: t("admin.nav.aiReview") },
            { href: "/admin/ai-usage", label: t("admin.nav.aiUsage") },
          ],
        },
      ],
    },
    {
      label: t("admin.nav.groupCatalog"),
      items: [
        { href: "/admin/sellers", label: t("admin.nav.sellers"), icon: Store },
        { href: "/admin/products", label: t("admin.nav.products"), icon: Package },
        {
          href: "/admin/banners",
          label: t("admin.nav.banners"),
          icon: ImageIcon,
          items: [
            { href: "/admin/banners", label: t("admin.nav.bannersMain") },
            { href: "/admin/shop-banners", label: t("admin.nav.bannersShops") },
          ],
        },
      ],
    },
    {
      label: t("admin.nav.groupFinance"),
      items: [
        {
          href: "/admin/subscriptions",
          label: t("admin.nav.subscriptions"),
          icon: Wallet,
          items: [
            { href: "/admin/subscriptions", label: t("admin.nav.subsPlans") },
            { href: "/admin/subscriptions/report", label: t("admin.nav.subsSales") },
          ],
        },
      ],
    },
    {
      label: t("admin.nav.groupAudience"),
      items: [
        { href: "/admin/users", label: t("admin.nav.users"), icon: Users },
        { href: "/admin/broadcast", label: t("admin.nav.broadcast"), icon: Send },
      ],
    },
    {
      label: t("admin.nav.groupSystem"),
      items: [{ href: "/admin/settings", label: t("admin.nav.settings"), icon: Settings }],
    },
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
    <DashboardShell items={groups} sectionLabel={t("admin.panel")} brand={brand}>
      {children}
    </DashboardShell>
  );
}
