"use client";

import { useMemo, useState } from "react";
import { RotateCcw, Search, X } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/shared/pagination";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";
import {
  useAdminAiUsageControllerList,
  useAdminAiUsageControllerTotals,
} from "@/lib/api/generated/endpoints/ai-usage-admin/ai-usage-admin";
import { devAiUsage, devFallbackPage, usingDevData } from "@/lib/api/dev-fixtures";
import type { AiUsageRow, AiUsageTotals, Paginated } from "@/lib/api/types";
import type {
  AdminAiUsageControllerListOperation,
  AdminAiUsageControllerListPeriod,
  AdminAiUsageControllerListSort,
} from "@/lib/api/generated/schemas";

const OPERATIONS: AdminAiUsageControllerListOperation[] = [
  "prompt",
  "description",
  "image",
  "autofill",
  "banner",
];

type Payer = "all" | "free" | "paid" | "platform";

export default function AdminAiUsage() {
  const { t, locale } = useT();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [operation, setOperation] = useState<AdminAiUsageControllerListOperation | null>(null);
  const [payer, setPayer] = useState<Payer>("all");
  const [period, setPeriod] = useState<AdminAiUsageControllerListPeriod>("all");
  const [sort, setSort] = useState<AdminAiUsageControllerListSort>("newest");

  const hasActiveFilters =
    Boolean(q.trim()) ||
    operation !== null ||
    payer !== "all" ||
    period !== "all" ||
    sort !== "newest";

  const resetAllFilters = () => {
    setQ("");
    setOperation(null);
    setPayer("all");
    setPeriod("all");
    setSort("newest");
    setPage(1);
  };

  const { data, isLoading, isError } = useAdminAiUsageControllerList(
    {
      page,
      limit: 20,
      q: q.trim() || undefined,
      operation: operation ?? undefined,
      free: payer === "free" ? true : payer === "paid" ? false : undefined,
      platform: payer === "platform" ? true : undefined,
      period: period === "all" ? undefined : period,
      sort: sort === "newest" ? undefined : sort,
    },
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
    const fixtures = devAiUsage.filter((r) => {
      if (operation && r.operation !== operation) return false;
      if (payer === "free" && !r.free) return false;
      if (payer === "paid" && (r.free || !r.shopId)) return false;
      if (payer === "platform" && r.shopId) return false;
      if (q.trim()) {
        const query = q.trim().toLowerCase();
        const matchesUser = (r.userName ?? "").toLowerCase().includes(query);
        const matchesUsername = (r.userUsername ?? "").toLowerCase().includes(query);
        const matchesShop = (r.shopName ?? "").toLowerCase().includes(query);
        const matchesModel = (r.model ?? "").toLowerCase().includes(query);
        if (!matchesUser && !matchesUsername && !matchesShop && !matchesModel) return false;
      }
      return true;
    });
    return devFallbackPage(data, fixtures);
  }, [data, operation, payer, q]);

  const rows = pageData.data;
  const isDevData = usingDevData(data?.data);

  const paidUsd = totals?.usd ?? 0;
  const freeUsd = totals?.freeUsd ?? 0;
  const platformUsd = totals?.platformUsd ?? 0;
  const totalUsd = paidUsd + freeUsd + platformUsd;
  const chargedUsd = (totals?.credits ?? 0) / 1000;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader title={t("admin.aiUsage.title")} subtitle={t("admin.aiUsage.subtitle")} />

      {/* Основные показатели */}
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
          label={t("admin.aiUsage.statSpentPaid")}
          value={`$${paidUsd.toFixed(2)}`}
          loading={totalsQuery.isLoading}
        />
        <StatCard
          label={t("admin.aiUsage.statCharged")}
          value={`$${chargedUsd.toFixed(2)}`}
          loading={totalsQuery.isLoading}
        />
      </div>

      {/* Разбивка расходов */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label={t("admin.aiUsage.statSpentFree")}
          value={`$${freeUsd.toFixed(2)}`}
          hint={`${t("admin.aiUsage.statFreeRequests")}: ${totals?.freeRequests ?? 0}`}
          loading={totalsQuery.isLoading}
        />
        <StatCard
          label={t("admin.aiUsage.statSpentPlatform")}
          value={`$${platformUsd.toFixed(2)}`}
          hint={`${t("admin.aiUsage.statPlatformRequests")}: ${totals?.platformRequests ?? 0}`}
          loading={totalsQuery.isLoading}
        />
        <StatCard
          label={t("admin.aiUsage.statSpentTotal")}
          value={`$${totalUsd.toFixed(2)}`}
          loading={totalsQuery.isLoading}
        />
      </div>

      <p className="text-xs text-muted-foreground">{t("admin.aiUsage.spentHint")}</p>

      {/* Панель поиска и фильтров */}
      <Card className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Поле поиска */}
          <div className="relative min-w-[280px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder={t("admin.aiUsage.searchPlaceholder")}
              className="pr-9 pl-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Выпадающие списки: период и сортировка */}
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={period}
              onValueChange={(val) => {
                setPeriod(val as AdminAiUsageControllerListPeriod);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[140px] text-xs">
                <SelectValue placeholder={t("admin.aiUsage.periodLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.aiUsage.periodAll")}</SelectItem>
                <SelectItem value="today">{t("admin.aiUsage.periodToday")}</SelectItem>
                <SelectItem value="7d">{t("admin.aiUsage.period7d")}</SelectItem>
                <SelectItem value="30d">{t("admin.aiUsage.period30d")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(val) => {
                setSort(val as AdminAiUsageControllerListSort);
                setPage(1);
              }}
            >
              <SelectTrigger className="h-9 w-[170px] text-xs">
                <SelectValue placeholder={t("admin.aiUsage.sortLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("admin.aiUsage.sortNewest")}</SelectItem>
                <SelectItem value="oldest">{t("admin.aiUsage.sortOldest")}</SelectItem>
                <SelectItem value="cost_desc">{t("admin.aiUsage.sortCostDesc")}</SelectItem>
                <SelectItem value="credits_desc">{t("admin.aiUsage.sortCreditsDesc")}</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="h-9 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3.5" />
                {t("admin.aiUsage.resetFilters")}
              </Button>
            )}
          </div>
        </div>

        {/* Чипы фильтрации по операциям и типу списания */}
        <div className="flex flex-col gap-2.5 border-t border-border/60 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              {t("admin.aiUsage.colOperation")}:
            </span>
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

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-muted-foreground">
              {t("admin.aiUsage.colCost")}:
            </span>
            <FilterChip
              active={payer === "all"}
              onClick={() => {
                setPayer("all");
                setPage(1);
              }}
            >
              {t("admin.aiUsage.filterAll")}
            </FilterChip>
            <FilterChip
              active={payer === "free"}
              onClick={() => {
                setPayer("free");
                setPage(1);
              }}
            >
              {t("admin.aiUsage.filterFree")}
            </FilterChip>
            <FilterChip
              active={payer === "paid"}
              onClick={() => {
                setPayer("paid");
                setPage(1);
              }}
            >
              {t("admin.aiUsage.filterPaid")}
            </FilterChip>
            <FilterChip
              active={payer === "platform"}
              onClick={() => {
                setPayer("platform");
                setPage(1);
              }}
            >
              {t("admin.aiUsage.filterPlatform")}
            </FilterChip>
          </div>
        </div>

        {/* Счётчик найденных строк */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("admin.aiUsage.foundTotal", { count: pageData.meta.total })}</span>
        </div>
      </Card>

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

      {/* Таблица результатов */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">{t("admin.aiUsage.colUser")}</TableHead>
                <TableHead>{t("admin.aiUsage.colShop")}</TableHead>
                <TableHead>{t("admin.aiUsage.colOperation")}</TableHead>
                <TableHead className="text-right">{t("admin.aiUsage.colCost")}</TableHead>
                <TableHead className="text-right">{t("admin.aiUsage.colCredits")}</TableHead>
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
                          {r.userUsername ? `@${r.userUsername}` : t("admin.aiUsage.noUsername")}
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
                        <div className="flex items-center gap-1.5">
                          <span>{t(`admin.aiUsage.op.${r.operation}`)}</span>
                          {r.images > 0 && (
                            <Badge variant="secondary" className="px-1.5 py-0 text-[11px] tabular">
                              ×{r.images}
                            </Badge>
                          )}
                        </div>
                        {r.model && (
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {r.model}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="tabular text-right text-sm text-muted-foreground">
                        {r.usd === null ? t("admin.aiUsage.costUnknown") : `$${r.usd.toFixed(4)}`}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        <span className="tabular font-medium">
                          {r.credits}
                          {r.estimated && (
                            <span
                              className="ml-1 text-xs text-warning"
                              title={t("admin.aiUsage.estimatedHint")}
                            >
                              ≈
                            </span>
                          )}
                        </span>
                        {r.free && (
                          <div className="mt-0.5 text-xs font-normal text-primary">
                            {t("admin.aiUsage.freeBadge")}
                          </div>
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
  hint,
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
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
      {hint && !loading && <div className="tabular text-xs text-muted-foreground">{hint}</div>}
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
          ? "rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shadow-xs transition-colors"
          : "rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
      }
    >
      {children}
    </button>
  );
}
