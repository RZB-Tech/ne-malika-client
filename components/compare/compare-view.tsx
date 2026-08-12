"use client";

import { useT } from "@/components/providers/i18n-provider";
import { AddFromFavorites } from "./add-from-favorites";
import { AiComparePanel } from "./ai-compare-panel";
import { CompareTable } from "./compare-table";

export function CompareView() {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 lg:px-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {t("compare.title")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
        {t("compare.subtitle")}
      </p>

      <div className="mt-6 space-y-6">
        <AddFromFavorites />
        <CompareTable />
        <AiComparePanel />
      </div>
    </div>
  );
}
