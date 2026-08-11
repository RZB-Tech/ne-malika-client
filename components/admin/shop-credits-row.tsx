"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useAdminCreditsControllerBalance } from "@/lib/api/generated/endpoints/credits-admin/credits-admin";
import { useT } from "@/components/providers/i18n-provider";
import { DetailRow } from "@/components/admin/detail-drawer";

/**
 * Остаток кредитов магазина в его карточке.
 *
 * Отдельным запросом, а не полем в списке магазинов: баланс меняется на каждой
 * генерации, и тянуть его в таблицу означало бы обновлять весь список ради
 * одной цифры, которую видно только в открытой карточке.
 */
export function ShopCreditsRow({ shopId }: { shopId: number }) {
  const { t } = useT();
  const { data, isLoading, isError } = useAdminCreditsControllerBalance(
    shopId,
    { query: { retry: false } },
  );
  const credits = data as unknown as { available?: number } | undefined;

  if (isLoading) return <Skeleton className="h-5 w-24" />;
  if (isError || !credits) {
    return (
      <p className="text-sm text-destructive">
        {t("admin.credits.balanceFailed")}
      </p>
    );
  }

  return (
    <DetailRow
      label={t("admin.credits.balance")}
      value={t("admin.credits.balanceValue", {
        available: credits.available ?? 0,
      })}
    />
  );
}
