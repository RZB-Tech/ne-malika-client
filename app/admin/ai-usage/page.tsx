"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  useAdminAiUsageControllerList,
  useAdminAiUsageControllerTotals,
} from "@/lib/api/generated/endpoints/ai-usage-admin/ai-usage-admin";
import {
  devAiUsage,
  devFallbackPage,
  usingDevData,
} from "@/lib/api/dev-fixtures";
import type { AiUsageRow, AiUsageTotals, Paginated } from "@/lib/api/types";

const OPERATIONS = ["prompt", "description", "image", "autofill"] as const;
type Operation = (typeof OPERATIONS)[number];

/**
 * Журнал обращений к ИИ.
 *
 * Отвечает на вопрос «кто и для какого магазина жёг наши деньги»: журнал
 * кредитов ведётся по магазину и молчит про автора, а запросы администратора
 * не создают транзакции вовсе — за них платит площадка.
 */
export default function AdminAiUsage() {
  const { t, locale } = useT();
  const [page, setPage] = useState(1);
  const [operation, setOperation] = useState<Operation | null>(null);

  const { data, isLoading, isError } = useAdminAiUsageControllerList(
    { page, limit: 20, operation: operation ?? undefined },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AiUsageRow>,
        retry: false,
      },
    },
  );

  const totalsQuery = useAdminAiUsageControllerTotals({
    query: { retry: false },
  });
  const totals = totalsQuery.data as unknown as AiUsageTotals | undefined;

  const pageData = useMemo(() => {
    const fixtures = operation
      ? devAiUsage.filter((r) => r.operation === operation)
      : devAiUsage;
    return devFallbackPage(data, fixtures);
  }, [data, operation]);
  const rows = pageData.data;
  const isDevData = usingDevData(data?.data);

  /** Расход площадки и снятое с магазинов — разница между ними и есть заработок. */
  const spentUsd = totals?.usd ?? 0;
  const chargedUsd = (totals?.credits ?? 0) / 1000;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("admin.aiUsage.title")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("admin.aiUsage.subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard
          label={t("admin.aiUsage.statRequests")}
          value={String(totals?.requests ?? 0)}
          loading={totalsQuery.isLoading}
        />
        <StatCard
          label={t("admin.aiUsage.statImages")}
          value={String(totals?.images ?? 0)}
          loading={totalsQuery.isLoading}
        />
        <StatCard
          label={t("admin.aiUsage.statSpent")}
          value={`$${spentUsd.toFixed(2)}`}
          loading={totalsQuery.isLoading}
        />
        <StatCard
          label={t("admin.aiUsage.statCharged")}
          value={`$${chargedUsd.toFixed(2)}`}
          loading={totalsQuery.isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          active={operation === null}
          onClick={() => {
            setOperation(null);
            setPage(1);
          }}
        >
          {t("admin.aiUsage.filterAll")}
        </FilterChip>
        {OPERATIONS.map((op) => (
          <FilterChip
            key={op}
            active={operation === op}
            onClick={() => {
              setOperation(op);
              setPage(1);
            }}
          >
            {t(`admin.aiUsage.op.${op}`)}
          </FilterChip>
        ))}
      </div>

      {isError && !isDevData && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.aiUsage.loadFailed")}
        </Card>
      )}

      {isDevData && (
        <Card className="bg-muted/50 p-4 text-sm text-muted-foreground">
          {t("admin.common.devData")}
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">
                  {t("admin.aiUsage.colUser")}
                </TableHead>
                <TableHead>{t("admin.aiUsage.colShop")}</TableHead>
                <TableHead>{t("admin.aiUsage.colOperation")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.aiUsage.colCost")}
                </TableHead>
                <TableHead className="text-right">
                  {t("admin.aiUsage.colCredits")}
                </TableHead>
                <TableHead>{t("admin.aiUsage.colWhen")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !isDevData
                ? Array.from({ length: 5 }, (_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map((r) => (
                    <TableRow key={r.id} className="hover:bg-transparent">
                      <TableCell>
                        <div className="text-sm font-medium">
                          {r.userName ?? t("admin.aiUsage.userGone")}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {r.userUsername
                            ? `@${r.userUsername}`
                            : t("admin.aiUsage.noUsername")}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {r.shopName ?? (
                          <Badge
                            variant="outline"
                            className="border-transparent bg-primary/10 text-xs font-medium text-primary"
                          >
                            {t("admin.aiUsage.platformPays")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t(`admin.aiUsage.op.${r.operation}`)}
                        {r.images > 0 && (
                          <span className="tabular text-muted-foreground">
                            {" "}
                            ×{r.images}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular text-right text-sm text-muted-foreground">
                        {r.usd === null
                          ? t("admin.aiUsage.costUnknown")
                          : `$${r.usd.toFixed(4)}`}
                      </TableCell>
                      <TableCell className="tabular text-right text-sm">
                        {r.credits}
                        {r.estimated && (
                          <span
                            className="ml-1 text-xs text-warning"
                            title={t("admin.aiUsage.estimatedHint")}
                          >
                            ≈
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(r.createdAt, locale)}
                      </TableCell>
                    </TableRow>
                  ))}

              {!isLoading && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={6}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t("admin.aiUsage.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Pagination
        page={pageData.meta.page}
        totalPages={pageData.meta.totalPages}
        total={pageData.meta.total}
        onChange={setPage}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: string;
  loading: boolean;
}) {
  return (
    <Card className="gap-1 p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      {loading ? (
        <Skeleton className="h-7 w-20" />
      ) : (
        <div className="tabular font-heading text-xl font-bold">{value}</div>
      )}
    </Card>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          : "rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted/70"
      }
    >
      {children}
    </button>
  );
}
