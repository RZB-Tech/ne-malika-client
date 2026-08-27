"use client";

import { useState } from "react";
import { CheckCircle2, Clock, TriangleAlert, XCircle } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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
import { planLabel } from "@/lib/api/subscription";
import { formatDate, formatPrice, priceText } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSellerSubscriptionsControllerPayments } from "@/lib/api/generated/endpoints/subscriptions-seller/subscriptions-seller";
import type {
  SubscriptionPaymentDto,
  SubscriptionPaymentDtoStatus,
} from "@/lib/api/generated/schemas";

const LIMIT = 10;

/**
 * История платежей за подписку: и оплаты через кассу, и ручные активации
 * администратором.
 *
 * Строка живёт дольше денег: Prepare заводит её раньше списания, а отказ на
 * Complete оставляет `cancelled` с возвратом. Поэтому рядом со статусом стоят
 * пометки о возврате и о том, что платёж ждёт разбора человеком — без них
 * продавец видел бы «Отменён» и не понимал, вернулись ли деньги.
 */
export function SubscriptionPayments() {
  const { t, locale } = useT();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useSellerSubscriptionsControllerPayments(
    { page, limit: LIMIT },
    { query: { retry: false } },
  );

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold tracking-tight">
          {t("seller.subscription.payments.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("seller.subscription.payments.subtitle")}
        </p>
      </div>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.subscription.payments.loadFailed")}
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[140px]">
                  {t("seller.subscription.payments.colDate")}
                </TableHead>
                <TableHead>
                  {t("seller.subscription.payments.colPlan")}
                </TableHead>
                <TableHead className="text-right">
                  {t("seller.subscription.payments.colAmount")}
                </TableHead>
                <TableHead className="min-w-[160px]">
                  {t("seller.subscription.payments.colStatus")}
                </TableHead>
                <TableHead className="min-w-[180px]">
                  {t("seller.subscription.payments.colPeriod")}
                </TableHead>
                <TableHead className="text-right">
                  {t("seller.subscription.payments.colBilling")}
                </TableHead>
                <TableHead className="text-right">
                  {t("seller.subscription.payments.colCredits")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }, (_, i) => (
                    <TableRow key={i} className="hover:bg-transparent">
                      <TableCell colSpan={7}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : rows.map((p) => (
                    <TableRow key={p.id} className="hover:bg-transparent">
                      <TableCell className="align-top">
                        <div className="tabular text-sm whitespace-nowrap">
                          {formatDate(p.paidAt ?? p.createdAt, locale)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {p.provider === "manual"
                            ? t("seller.subscription.payments.manual")
                            : t(
                                `seller.subscription.provider.${p.provider}`,
                              )}
                        </div>
                      </TableCell>

                      <TableCell className="align-top text-sm">
                        {planLabel(p.plan, t)}
                      </TableCell>

                      <TableCell className="tabular align-top text-right text-sm whitespace-nowrap">
                        {priceText(p.amount, locale, t)}
                      </TableCell>

                      <TableCell className="align-top">
                        <PaymentStatusBadge status={p.status} />
                        <Notes payment={p} />
                      </TableCell>

                      <TableCell className="align-top text-sm text-muted-foreground">
                        {p.activatedFrom && p.activatedUntil ? (
                          <span className="tabular whitespace-nowrap">
                            {t("seller.subscription.payments.period", {
                              from: formatDate(p.activatedFrom, locale),
                              to: formatDate(p.activatedUntil, locale),
                            })}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell className="tabular align-top text-right text-sm text-muted-foreground">
                        {p.merchantBillingId}
                      </TableCell>

                      <TableCell className="align-top text-right text-sm">
                        {p.grantedCredits ? (
                          <div className="tabular whitespace-nowrap text-success">
                            {t("seller.subscription.payments.granted", {
                              credits: formatPrice(p.grantedCredits, locale),
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                        {/*
                          Сгоревшее показываем рядом с выданным: это две стороны
                          одной операции, и продавец должен видеть, что остаток
                          не пропал сам по себе, а был заменён новой нормой.
                        */}
                        {p.burnedCredits ? (
                          <div className="tabular whitespace-nowrap text-xs text-warning">
                            {t("seller.subscription.payments.burned", {
                              credits: formatPrice(p.burnedCredits, locale),
                            })}
                          </div>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}

              {/* «Платежей не было» — только когда список действительно пуст:
                  на отказе сервера это была бы неправда, и продавец решил бы,
                  что журнал стёрли. */}
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t("seller.subscription.payments.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {data && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onChange={setPage}
        />
      )}
    </div>
  );
}

/**
 * Статус платежа.
 *
 * `prepared` и `pending` — касса открыта, денег там ещё нет: Prepare ничего не
 * списывает. `failed` — деньги списаны, а выдать подписку не удалось; такую
 * строку разбирает человек, и красная она не за компанию с «отменён», а по
 * существу.
 */
function PaymentStatusBadge({
  status,
}: {
  status: SubscriptionPaymentDtoStatus;
}) {
  const { t } = useT();
  const cfg: Record<
    SubscriptionPaymentDtoStatus,
    { cls: string; Icon: typeof Clock }
  > = {
    pending: { cls: "bg-warning/15 text-warning", Icon: Clock },
    prepared: { cls: "bg-warning/15 text-warning", Icon: Clock },
    paid: { cls: "bg-success/12 text-success", Icon: CheckCircle2 },
    cancelled: { cls: "bg-muted text-muted-foreground", Icon: XCircle },
    failed: {
      cls: "bg-destructive/12 text-destructive",
      Icon: TriangleAlert,
    },
  };
  const known = status in cfg ? status : "pending";
  const { cls, Icon } = cfg[known];

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border-transparent font-medium", cls)}
    >
      <Icon className="size-3" />
      {t(`seller.subscription.status.${known}`)}
    </Badge>
  );
}

/** Пометки под статусом: что стало с деньгами и ждёт ли строка разбора. */
function Notes({ payment }: { payment: SubscriptionPaymentDto }) {
  const { t } = useT();
  const lines: string[] = [];

  if (payment.reversed) lines.push(t("seller.subscription.payments.reversed"));
  if (payment.refundedByProvider) {
    lines.push(t("seller.subscription.payments.refunded"));
  }
  if (payment.errorNote) {
    lines.push(
      t("seller.subscription.payments.errorNote", {
        reason: payment.errorNote,
      }),
    );
  }
  if (payment.note) lines.push(payment.note);

  if (lines.length === 0 && !payment.needsManualReview) return null;

  return (
    <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
      {payment.needsManualReview && (
        <div className="font-medium text-destructive">
          {t("seller.subscription.payments.needsReview")}
        </div>
      )}
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </div>
  );
}
