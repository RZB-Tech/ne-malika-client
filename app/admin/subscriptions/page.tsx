"use client";

import { useMemo, useState } from "react";
import {
  Ban,
  Clock,
  ExternalLink,
  History,
  Search,
  TriangleAlert,
  Wallet,
} from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { EntityStatusBadge } from "@/components/admin/entity-status-badge";
import {
  DetailDrawer,
  DetailNote,
} from "@/components/admin/detail-drawer";
import {
  RowActionsMenu,
  RowContextMenu,
  type RowAction,
} from "@/components/admin/row-actions";
import {
  SubscriptionActivateDialog,
  type SubscriptionActivateTarget,
} from "@/components/admin/subscription-activate-dialog";
import { Pagination } from "@/components/shared/pagination";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/utils";
import { formatDate, formatPrice } from "@/lib/format";
import { planLabel } from "@/lib/api/subscription";
import type { AdminSubscriptionRow, Paginated } from "@/lib/api/types";
import {
  getAdminSubscriptionsControllerListQueryKey,
  useAdminShopSubscriptionControllerCancel,
  useAdminShopSubscriptionControllerPayments,
  useAdminSubscriptionsControllerList,
} from "@/lib/api/generated/endpoints/subscriptions-admin/subscriptions-admin";
import type {
  AdminSubscriptionsControllerListParams,
  SubscriptionPaymentDto,
} from "@/lib/api/generated/schemas";

/** Горизонт вкладки «Истекают»: неделя — столько занимает разговор о продлении. */
const EXPIRING_DAYS = 7;

type Tab = "all" | "start" | "pro" | "max" | "expiring" | "free" | "review";

/**
 * Вкладки — это готовые наборы фильтров ручки, а не клиентская фильтрация:
 * список страничный, и отбор «на месте» показывал бы срез двадцати строк
 * вместо среза всей базы.
 *
 * `free` на сервере значит «подписка не действует» — сюда попадают и те, кто не
 * платил никогда, и бывшие подписчики с истёкшим сроком. Отдельной вкладки
 * «истёкшие» поэтому нет: такого фильтра у ручки не существует, а разделить их
 * можно только по `storedPlan`, который виден прямо в строке.
 */
const TABS: readonly {
  value: Tab;
  labelKey: string;
  params: Partial<AdminSubscriptionsControllerListParams>;
}[] = [
  { value: "all", labelKey: "admin.subscriptions.tabAll", params: {} },
  {
    value: "start",
    labelKey: "admin.subscriptions.tabStart",
    params: { plan: "start" },
  },
  {
    value: "pro",
    labelKey: "admin.subscriptions.tabPro",
    params: { plan: "pro" },
  },
  {
    value: "max",
    labelKey: "admin.subscriptions.tabMax",
    params: { plan: "max" },
  },
  {
    value: "expiring",
    labelKey: "admin.subscriptions.tabExpiring",
    params: { expiring_days: EXPIRING_DAYS },
  },
  {
    value: "free",
    labelKey: "admin.subscriptions.tabFree",
    params: { plan: "free" },
  },
  {
    value: "review",
    labelKey: "admin.subscriptions.tabReview",
    params: { needs_review: true },
  },
];

export default function AdminSubscriptions() {
  const { t, locale } = useT();
  const run = useAdminMutation();

  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [activating, setActivating] =
    useState<SubscriptionActivateTarget | null>(null);
  const [paymentsShop, setPaymentsShop] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [paymentsPage, setPaymentsPage] = useState(1);

  const tabParams = useMemo(
    () => TABS.find((item) => item.value === tab)?.params ?? {},
    [tab],
  );

  /**
   * `select` здесь не косметика: в сгенерированном `AdminSubscriptionRowDto`
   * поле `shopStatus` объявлено как `string` — из `pgEnum` в OpenAPI попал
   * голый тип. `EntityStatusBadge` ждёт `EntityStatus`, и без сужения строка
   * таблицы не собралась бы.
   */
  const { data, isLoading, isError } = useAdminSubscriptionsControllerList(
    { page, limit: 20, q: q.trim() || undefined, ...tabParams },
    {
      query: {
        select: (raw) => raw as unknown as Paginated<AdminSubscriptionRow>,
        retry: false,
      },
    },
  );

  const cancelMutation = useAdminShopSubscriptionControllerCancel();

  const rows = data?.data ?? [];
  const meta = data?.meta;

  const cancel = async (shopId: number, reason: string) => {
    await run(() => cancelMutation.mutateAsync({ shopId, data: { reason } }), {
      invalidate: [getAdminSubscriptionsControllerListQueryKey()],
      successKey: "admin.subscriptions.cancelled",
      errorKey: "admin.subscriptions.actionFailed",
    });
  };

  const openPayments = (row: AdminSubscriptionRow) => {
    setPaymentsPage(1);
    setPaymentsShop({ id: row.shopId, name: row.shopName });
  };

  /** Один набор действий и для трёх точек, и для правой кнопки мыши. */
  const actionsFor = (row: AdminSubscriptionRow): RowAction[] => [
    {
      label: t("admin.subscriptions.openShop"),
      icon: ExternalLink,
      href: `/store/${row.shopId}`,
    },
    {
      label: t("admin.subscriptions.payments"),
      icon: History,
      onSelect: () => openPayments(row),
    },
    {
      label: t("admin.subscriptions.activate"),
      icon: Wallet,
      onSelect: () =>
        setActivating({
          shopId: row.shopId,
          shopName: row.shopName,
          plan: row.plan,
          active: row.active,
          until: row.until,
          subscriptionCredits: row.subscriptionCredits,
        }),
    },
    ...(row.active
      ? [
          {
            label: t("admin.subscriptions.cancel"),
            icon: Ban,
            destructive: true,
            withReason: {
              title: t("admin.subscriptions.cancelTitle"),
              description: t("admin.subscriptions.cancelText"),
              onConfirm: (reason: string) => cancel(row.shopId, reason),
            },
          } satisfies RowAction,
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("admin.subscriptions.title")}
        subtitle={t("admin.subscriptions.subtitle")}
      />

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder={t("admin.subscriptions.search")}
          className="pl-9"
        />
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          setTab(value as Tab);
          setPage(1);
        }}
      >
        <TabsList>
          {TABS.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {t(item.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {tab === "review" && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.subscriptions.reviewHint")}
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("admin.subscriptions.loadFailed")}
        </Card>
      )}

      {/*
        Общая подсказка про строку, а не `admin.subscriptions.hint`: та обещает
        «открыть магазин», а нажатие открывает карточку платежей — магазин
        рядом, отдельным пунктом меню строки.
      */}
      <p className="text-xs text-muted-foreground">
        {t("admin.common.rowHint")}
      </p>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[200px]">
                  {t("admin.subscriptions.colShop")}
                </TableHead>
                <TableHead>{t("admin.subscriptions.colOwner")}</TableHead>
                <TableHead>{t("admin.subscriptions.colPlan")}</TableHead>
                <TableHead>{t("admin.subscriptions.colUntil")}</TableHead>
                <TableHead className="text-right">
                  {t("admin.subscriptions.colDaysLeft")}
                </TableHead>
                <TableHead className="text-right">
                  {t("admin.subscriptions.colCredits")}
                </TableHead>
                <TableHead>{t("admin.subscriptions.colLastPayment")}</TableHead>
                {/* Флаги разбора: заголовка нет — их читают по цвету, не по подписи. */}
                <TableHead className="min-w-[150px]" />
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <RowContextMenu key={row.shopId} actions={actionsFor(row)}>
                  <TableRow
                    onClick={() => openPayments(row)}
                    className={cn(
                      "cursor-pointer",
                      /**
                       * Строка целиком в красном, а не один значок в углу:
                       * «деньги списаны, подписка не выдана» — единственное
                       * состояние в этой таблице, из-за которого сюда заходят
                       * не глядя на остальное.
                       */
                      row.needsManualReview && "bg-destructive/5",
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {row.shopName}
                        </span>
                        {row.shopStatus !== "active" && (
                          <EntityStatusBadge status={row.shopStatus} />
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">{row.ownerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.ownerUsername
                          ? `@${row.ownerUsername}`
                          : t("common.noUsername")}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent font-medium",
                          row.active
                            ? "bg-primary/12 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {planLabel(row.plan, t)}
                      </Badge>
                      {row.storedPlan !== row.plan && (
                        <div
                          className="mt-1 text-xs text-muted-foreground"
                          title={t("admin.subscriptions.storedPlanHint")}
                        >
                          {t("admin.subscriptions.storedPlan", {
                            plan: planLabel(row.storedPlan, t),
                          })}
                        </div>
                      )}
                    </TableCell>

                    <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                      {row.until
                        ? formatDate(row.until, locale)
                        : t("admin.subscriptions.never")}
                    </TableCell>

                    <TableCell className="tabular whitespace-nowrap text-right text-sm">
                      {row.active && row.daysLeft !== null ? (
                        t("admin.subscriptions.days", { days: row.daysLeft })
                      ) : row.until ? (
                        <span className="text-destructive">
                          {t("admin.subscriptions.expired")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("admin.subscriptions.never")}
                        </span>
                      )}
                    </TableCell>

                    {/*
                      `formatPrice`, а не `formatNumber`: второй с десяти тысяч
                      переходит на сокращённую запись, и 10 450 кредитов стали
                      бы «10,5 тыс.». В таблице, по которой разбирают деньги,
                      округление — это потерянная разница.
                    */}
                    <TableCell className="tabular text-right text-sm">
                      {formatPrice(row.subscriptionCredits, locale)}
                    </TableCell>

                    <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                      {row.lastPaidAt
                        ? formatDate(row.lastPaidAt, locale)
                        : t("admin.subscriptions.never")}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {row.needsManualReview && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-transparent bg-destructive/12 font-medium text-destructive"
                            title={t("admin.subscriptions.reviewHint")}
                          >
                            <TriangleAlert className="size-3" />
                            {t("admin.subscriptions.needsReview")}
                          </Badge>
                        )}
                        {row.stuckPrepared && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-transparent bg-warning/15 font-medium text-warning"
                            title={t("admin.subscriptions.stuckPreparedHint")}
                          >
                            <Clock className="size-3" />
                            {t("admin.subscriptions.stuckPrepared")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <RowActionsMenu actions={actionsFor(row)} />
                    </TableCell>
                  </TableRow>
                </RowContextMenu>
              ))}
            </TableBody>
          </Table>
        </div>

        {isLoading && (
          <div className="flex flex-col gap-2 p-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        )}
        {!isLoading && rows.length === 0 && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            {q.trim()
              ? t("common.nothingFound")
              : t("admin.subscriptions.empty")}
          </div>
        )}
      </Card>

      <Pagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onChange={setPage}
      />

      <SubscriptionActivateDialog
        target={activating}
        onClose={() => setActivating(null)}
      />

      <PaymentsDrawer
        shop={paymentsShop}
        page={paymentsPage}
        onPageChange={setPaymentsPage}
        onClose={() => setPaymentsShop(null)}
      />
    </div>
  );
}

/**
 * Журнал платежей магазина.
 *
 * Флаги в таблице говорят, У КОГО деньги потерялись; разобрать случай можно
 * только здесь: номер счёта провайдера, что он ответил, был ли возврат, сколько
 * кредитов выдано и сколько сгорело. Без этого списка красный значок в строке —
 * сообщение без продолжения.
 *
 * Подписи взяты из `seller.subscription.payments.*`: продавец и администратор
 * смотрят на одну и ту же строку платежа, и два словаря одних и тех же слов
 * разъехались бы на первой правке.
 */
function PaymentsDrawer({
  shop,
  page,
  onPageChange,
  onClose,
}: {
  shop: { id: number; name: string } | null;
  page: number;
  onPageChange: (page: number) => void;
  onClose: () => void;
}) {
  const { t } = useT();
  const open = shop !== null;

  const { data, isLoading, isError } = useAdminShopSubscriptionControllerPayments(
    shop?.id ?? 0,
    { page, limit: 10 },
    { query: { enabled: open, retry: false } },
  );

  const payments = data?.data ?? [];
  const meta = data?.meta;

  return (
    <DetailDrawer
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={t("admin.subscriptions.payments")}
      description={shop?.name}
    >
      {isError && (
        <DetailNote tone="danger">
          {t("seller.subscription.payments.loadFailed")}
        </DetailNote>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : payments.length === 0 && !isError ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {t("seller.subscription.payments.empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} payment={payment} />
          ))}
        </div>
      )}

      <Pagination
        page={meta?.page ?? page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total}
        onChange={onPageChange}
      />
    </DetailDrawer>
  );
}

function PaymentCard({ payment }: { payment: SubscriptionPaymentDto }) {
  const { t, locale } = useT();

  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-medium">
          {planLabel(payment.plan, t)}
        </span>
        <span className="tabular text-sm font-medium">
          {formatPrice(payment.amount, locale)} {t("common.currency")}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
        <span className="tabular">
          {formatDate(payment.paidAt ?? payment.createdAt, locale)}
        </span>
        <span>· {t(`seller.subscription.status.${payment.status}`)}</span>
        <span>· {t(`seller.subscription.provider.${payment.provider}`)}</span>
        <span className="tabular">
          · {t("seller.subscription.payments.colBilling")}{" "}
          {payment.merchantBillingId}
        </span>
      </div>

      {payment.activatedFrom && payment.activatedUntil && (
        <p className="tabular mt-1 text-xs text-muted-foreground">
          {t("seller.subscription.payments.period", {
            from: formatDate(payment.activatedFrom, locale),
            to: formatDate(payment.activatedUntil, locale),
          })}
        </p>
      )}

      {payment.grantedCredits !== null && (
        <p className="tabular mt-1 text-xs text-muted-foreground">
          {t("seller.subscription.payments.granted", {
            credits: formatPrice(payment.grantedCredits, locale),
          })}
          {payment.burnedCredits
            ? ` · ${t("seller.subscription.payments.burned", {
                credits: formatPrice(payment.burnedCredits, locale),
              })}`
            : ""}
        </p>
      )}

      {payment.provider === "manual" && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("seller.subscription.payments.manual")}
        </p>
      )}

      {payment.note && (
        <p className="mt-1 text-xs text-muted-foreground">{payment.note}</p>
      )}

      {payment.errorNote && (
        <p className="mt-1 text-xs text-destructive">
          {t("seller.subscription.payments.errorNote", {
            reason: payment.errorNote,
          })}
        </p>
      )}

      {payment.reversed && (
        <p className="mt-1 text-xs text-muted-foreground">
          {t("seller.subscription.payments.reversed")}
        </p>
      )}

      {payment.refundedByProvider && (
        <p className="mt-1 text-xs text-destructive">
          {t("seller.subscription.payments.refunded")}
        </p>
      )}

      {payment.needsManualReview && (
        <Badge
          variant="outline"
          className="mt-2 gap-1 border-transparent bg-destructive/12 font-medium text-destructive"
        >
          <TriangleAlert className="size-3" />
          {t("seller.subscription.payments.needsReview")}
        </Badge>
      )}
    </div>
  );
}
