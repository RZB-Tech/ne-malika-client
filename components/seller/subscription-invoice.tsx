"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Phone, TriangleAlert } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/components/providers/i18n-provider";
import { apiErrorMessage } from "@/lib/api/errors";
import { PAID_PLANS, planLabel } from "@/lib/api/subscription";
import { formatPrice } from "@/lib/format";
import {
  getSellerSubscriptionsControllerStateQueryKey,
  sellerSubscriptionsControllerInvoiceState,
  useSellerSubscriptionsControllerInvoice,
} from "@/lib/api/generated/endpoints/subscriptions-seller/subscriptions-seller";
import type {
  InvoiceDto,
  SellerSubscriptionDto,
} from "@/lib/api/generated/schemas";
import type { PaidPlan } from "@/lib/api/types";
import { useQueryClient } from "@tanstack/react-query";

const POLL_MS = 5000;
const POLL_LIMIT = 60;

export function SubscriptionInvoice({
  subscription,
}: {
  subscription: SellerSubscriptionDto;
}) {
  const { t, locale } = useT();
  const queryClient = useQueryClient();

  const [plan, setPlan] = useState<PaidPlan>("start");
  const [phone, setPhone] = useState("");
  const [invoice, setInvoice] = useState<InvoiceDto | null>(null);
  const [ticks, setTicks] = useState(0);

  const create = useSellerSubscriptionsControllerInvoice();

  useEffect(() => {
    if (!invoice || invoice.status !== "pending" || ticks >= POLL_LIMIT) return;

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const next = await sellerSubscriptionsControllerInvoiceState(
            invoice.orderId,
          );
          setInvoice(next);
          setTicks((n) => n + 1);
          if (next.status === "paid") {
            toast.success(t("seller.subscription.invoicePaid"));
            await queryClient.invalidateQueries({
              queryKey: getSellerSubscriptionsControllerStateQueryKey(),
            });
          }
        } catch {
          setTicks((n) => n + 1);
        }
      })();
    }, POLL_MS);

    return () => clearTimeout(timer);
  }, [invoice, ticks, queryClient, t]);

  const send = async () => {
    try {
      const created = await create.mutateAsync({ data: { plan, phone } });
      setInvoice(created);
      setTicks(0);
      toast.success(t("seller.subscription.invoiceSent"));
    } catch (err) {
      toast.error(
        apiErrorMessage(err, t, "seller.subscription.invoiceFailed"),
      );
    }
  };

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h3 className="font-heading text-base font-bold tracking-tight">
          {t("seller.subscription.invoiceTitle")}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("seller.subscription.invoiceText")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="invoice-plan">
            {t("seller.subscription.invoicePlan")}
          </Label>
          <Select
            value={plan}
            onValueChange={(value) => setPlan(value as PaidPlan)}
          >
            <SelectTrigger id="invoice-plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAID_PLANS.map((id) => (
                <SelectItem key={id} value={id}>
                  {planLabel(id, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="invoice-phone">
            {t("seller.subscription.invoicePhone")}
          </Label>
          <Input
            id="invoice-phone"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+998 90 123 45 67"
          />
        </div>

        <Button
          onClick={() => void send()}
          disabled={create.isPending || phone.trim().length < 9}
        >
          {create.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Phone className="size-4" />
          )}
          {t("seller.subscription.invoiceSend")}
        </Button>
      </div>

      {invoice && (
        <div
          className={cnStatus(invoice.status)}
          role="status"
          aria-live="polite"
        >
          {invoice.status === "paid" ? (
            <Check className="size-4 shrink-0 text-success" />
          ) : invoice.status === "cancelled" ? (
            <TriangleAlert className="size-4 shrink-0 text-destructive" />
          ) : (
            <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
          )}
          <span>
            {invoice.status === "paid"
              ? t("seller.subscription.invoicePaid")
              : invoice.status === "cancelled"
                ? t("seller.subscription.invoiceCancelled")
                : ticks >= POLL_LIMIT
                  ? t("seller.subscription.invoiceStale", {
                      order: invoice.orderId,
                    })
                  : t("seller.subscription.invoiceWaiting", {
                      phone: invoice.phone,
                      amount: formatPrice(invoice.amountUzs, locale),
                      order: invoice.orderId,
                    })}
          </span>
        </div>
      )}

      {!subscription.active && (
        <p className="text-xs text-muted-foreground">
          {t("seller.subscription.invoiceHint")}
        </p>
      )}
    </Card>
  );
}

function cnStatus(status: InvoiceDto["status"]): string {
  const base = "flex items-start gap-2 rounded-md border p-3 text-sm";
  if (status === "paid") return `${base} border-success/40 bg-success/5`;
  if (status === "cancelled")
    return `${base} border-destructive/40 bg-destructive/5`;
  return `${base} border-border bg-muted/40`;
}
