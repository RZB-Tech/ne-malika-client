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
import { AdminPageHeader } from "@/components/admin/page-header";
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
 * Чем оплачен запрос. `null` — не фильтруем.
 *
 * Появилось вместе с подписками: строки с `credits = 0` при непустом магазине
 * теперь бывают двух видов — норма тарифа и сбой списания, — и разбирать
 * жалобу «за что списали» без этого разделения пришлось бы глазами по всей
 * ленте.
 */
const PAYERS = ["free", "paid"] as const;
type Payer = (typeof PAYERS)[number];

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
  const [payer, setPayer] = useState<Payer | null>(null);

  const { data, isLoading, isError } = useAdminAiUsageControllerList(
    {
      page,
      limit: 20,
      operation: operation ?? undefined,
      /**
       * `free` — трёхзначный фильтр: `undefined` не уходит в запрос вовсе,
       * а `false` уйти обязан. Писать `payer === "free" || undefined` нельзя:
       * тогда «только платные» ничем не отличалось бы от «все».
       */
      free: payer === null ? undefined : payer === "free",
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
    /**
     * Фикстуры фильтруем теми же двумя условиями, что и сервер: иначе на
     * стенде без бэкенда чипы стояли бы нажатыми, а лента не менялась — и
     * фильтр читался бы как сломанный. `free` в фикстурах необязателен, его
     * отсутствие — это «платно».
     */
    const fixtures = devAiUsage.filter(
      (r) =>
        (!operation || r.operation === operation) &&
        (payer === null || Boolean(r.free) === (payer === "free")),
    );
    return devFallbackPage(data, fixtures);
  }, [data, operation, payer]);
  const rows = pageData.data;
  const isDevData = usingDevData(data?.data);

  /**
   * Расход разложен на три кармана, и складывать их обратно ради «сколько мы
   * потратили» — задача этой страницы, а не сервера.
   *
   * `usd` сменил смысл вместе с подписками: теперь это **только** операции, за
   * которые списаны кредиты. Ровно эта сумма сравнима с `chargedUsd`, и только
   * их разница — заработок на ИИ. Показывать её под прежней подписью «Потрачено
   * у OpenRouter» значило бы занижать расход площадки ровно на подписочные и
   * административные запросы и молчать об этом.
   *
   * `freeUsd` — автозаполнения по норме и безлимиту тарифа: расход настоящий,
   * но покрыт абонплатой, которой в этой сводке нет вовсе. `platformUsd` —
   * запросы администратора, у них выручки не предполагалось.
   */
  const paidUsd = totals?.usd ?? 0;
  const freeUsd = totals?.freeUsd ?? 0;
  const platformUsd = totals?.platformUsd ?? 0;
  const totalUsd = paidUsd + freeUsd + platformUsd;
  const chargedUsd = (totals?.credits ?? 0) / 1000;

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("admin.aiUsage.title")}
        subtitle={t("admin.aiUsage.subtitle")}
      />

      {/*
        Первый ряд — то, ради чего сюда заходят: объём и маржа. «Расход по
        платным» и «Снято с магазинов» стоят рядом намеренно, это единственная
        пара чисел в сводке, которую можно вычитать одно из другого.
      */}
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

      {/*
        Второй ряд — остальные два кармана и полный расход. Без него сводка
        отвечает «сколько мы заработали», но не отвечает «сколько мы потратили».
      */}
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

      <p className="text-xs text-muted-foreground">
        {t("admin.aiUsage.spentHint")}
      </p>

      <div className="flex flex-col gap-2">
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

        {/*
          Второй ряд чипов — чем оплачен запрос. Отдельной строкой, а не в
          общем ряду: это другой вопрос к той же ленте, и вперемешку с видами
          операций чипы читались бы как один список с двумя нажатыми кнопками.
        */}
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={payer === null}
            onClick={() => {
              setPayer(null);
              setPage(1);
            }}
          >
            {t("admin.aiUsage.filterAll")}
          </FilterChip>
          {PAYERS.map((p) => (
            <FilterChip
              key={p}
              active={payer === p}
              onClick={() => {
                setPayer(p);
                setPage(1);
              }}
            >
              {p === "free"
                ? t("admin.aiUsage.filterFree")
                : t("admin.aiUsage.filterPaid")}
            </FilterChip>
          ))}
        </div>
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
                      <TableCell className="text-right text-sm">
                        <span className="tabular">
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
                        {/*
                          Ноль кредитов у магазина сам по себе не говорит
                          ничего: так выглядит и норма тарифа, и несписание
                          из-за сбоя. Пометка разделяет эти два случая прямо
                          в строке — иначе жалобу «за что списали» пришлось бы
                          разбирать сверкой с журналом кредитов.
                        */}
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
  /** Вторая строка под числом: сколько запросов дали эту сумму. */
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
      {hint && !loading && (
        <div className="tabular text-xs text-muted-foreground">{hint}</div>
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
