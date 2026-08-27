"use client";

import { AdminPageHeader } from "@/components/admin/page-header";
import { SubscriptionReport } from "@/components/admin/subscription-report";
import { useT } from "@/components/providers/i18n-provider";

export default function AdminSubscriptionReportPage() {
  const { t } = useT();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title={t("admin.subsReport.title")}
        subtitle={t("admin.subsReport.subtitle")}
      />
      <SubscriptionReport />
    </div>
  );
}
