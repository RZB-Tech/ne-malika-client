"use client";

import { useState } from "react";
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
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useSellerCreditsControllerHistory } from "@/lib/api/generated/endpoints/credits-seller/credits-seller";
import type { CreditTxnDto } from "@/lib/api/generated/schemas";

const LIMIT = 10;

export function SubscriptionCredits() {
  const { t, locale } = useT();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useSellerCreditsControllerHistory(
    { page, limit: LIMIT },
    { query: { retry: false } },
  );

  const rows = data?.data ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold tracking-tight">
          {t("seller.credits.title")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("seller.credits.subtitle")}</p>
      </div>

      {isError && (
        <Card className="border-destructive/40 bg-destructive/5 p-4 text-sm">
          {t("seller.credits.loadFailed")}
        </Card>
      )}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[120px]">{t("seller.credits.colDate")}</TableHead>
                <TableHead>{t("seller.credits.colKind")}</TableHead>
                <TableHead className="text-right">{t("seller.credits.colAmount")}</TableHead>
                <TableHead className="min-w-[220px]">{t("seller.credits.colNote")}</TableHead>
                <TableHead className="min-w-[160px] text-right">
                  {t("seller.credits.colBalance")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }, (_, i) => (
                  <TableRow key={i} className="hover:bg-transparent">
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
                : rows.map((txn) => (
                  <TableRow key={txn.id} className="hover:bg-transparent">
                    <TableCell className="tabular align-top text-sm whitespace-nowrap">
                      {formatDate(txn.createdAt, locale)}
                    </TableCell>

                    <TableCell className="align-top text-sm">
                      {t(`seller.credits.kind.${txn.kind}`)}
                    </TableCell>

                    <TableCell
                      className={cn(
                        "tabular align-top text-right text-sm whitespace-nowrap",
                        txn.amount > 0 && "text-success",
                      )}
                    >
                      {txn.amount > 0 ? "+" : "−"}
                      {formatPrice(Math.abs(txn.amount), locale)}
                    </TableCell>

                    <TableCell className="align-top">
                      <Reason txn={txn} />
                    </TableCell>

                    <TableCell className="align-top text-right">
                      <div className="tabular text-sm font-medium">
                        {formatPrice(txn.balanceAfter, locale)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}

              { }
              {!isLoading && !isError && rows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    {t("seller.credits.empty")}
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

function Reason({ txn }: { txn: CreditTxnDto }) {
  const { t } = useT();
  const meta = txn.meta;

  const plan = meta?.plan ? planLabel(meta.plan, t) : "";
  const headline = meta?.promo
    ? t(`seller.credits.promo.${meta.promo}`, { plan }).trim()
    : meta?.operation
      ? t(`seller.credits.op.${meta.operation}`) +
      (meta.images && meta.images > 1 ? ` ×${meta.images}` : "")
      : (txn.note ?? t("seller.credits.noNote"));

  const details: string[] = [];
  if (meta?.free) details.push(t(`seller.credits.free.${meta.free}`));
  if (meta?.fixed) details.push(t("seller.credits.fixed"));
  if (txn.note && headline !== txn.note) details.push(txn.note);

  return (
    <div className="text-sm">
      <div>{headline}</div>
      {details.length > 0 && (
        <div className="mt-0.5 text-xs text-muted-foreground">{details.join(" · ")}</div>
      )}
    </div>
  );
}
