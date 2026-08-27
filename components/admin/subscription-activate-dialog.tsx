"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate, formatNumber } from "@/lib/format";
import { PAID_PLANS, isPaidPlan, planLabel } from "@/lib/api/subscription";
import type { PaidPlan, SubscriptionPlan } from "@/lib/api/types";
import {
  getAdminShopSubscriptionControllerPaymentsQueryKey,
  getAdminSubscriptionsControllerListQueryKey,
  useAdminShopSubscriptionControllerActivate,
} from "@/lib/api/generated/endpoints/subscriptions-admin/subscriptions-admin";

const MIN_MONTHS = 1;
const MAX_MONTHS = 12;

export interface SubscriptionActivateTarget {
  shopId: number;
  shopName: string;
  plan: SubscriptionPlan;
  active: boolean;
  until: string | null;
  subscriptionCredits: number;
}

export function SubscriptionActivateDialog({
  target,
  onClose,
}: {
  target: SubscriptionActivateTarget | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {target && (
          <ActivateBody
            key={target.shopId}
            target={target}
            onDone={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ActivateBody({
  target,
  onDone,
}: {
  target: SubscriptionActivateTarget;
  onDone: () => void;
}) {
  const { t, locale } = useT();
  const run = useAdminMutation();
  const activate = useAdminShopSubscriptionControllerActivate();

  const [plan, setPlan] = useState<PaidPlan>(
    isPaidPlan(target.plan) ? target.plan : PAID_PLANS[0],
  );
  const [months, setMonths] = useState("1");
  const [note, setNote] = useState("");

  const parsedMonths = Number(months);
  const validMonths =
    Number.isInteger(parsedMonths) &&
    parsedMonths >= MIN_MONTHS &&
    parsedMonths <= MAX_MONTHS;

  const submit = async () => {
    if (!validMonths) {
      toast.error(t("admin.subscriptions.activateMonthsHint"));
      return;
    }

    const ok = await run(
      () =>
        activate.mutateAsync({
          shopId: target.shopId,
          data: {
            plan,
            months: parsedMonths,
            note: note.trim() || undefined,
          },
        }),
      {
        invalidate: [
          getAdminSubscriptionsControllerListQueryKey(),
          getAdminShopSubscriptionControllerPaymentsQueryKey(target.shopId),
        ],
        successKey: "admin.subscriptions.activated",
        errorKey: "admin.subscriptions.actionFailed",
      },
    );
    if (ok) onDone();
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("admin.subscriptions.activateTitle")}</DialogTitle>
        <DialogDescription>
          {t("admin.subscriptions.activateText", { shop: target.shopName })}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-1.5">
        <Label>{t("admin.subscriptions.activatePlan")}</Label>
        <Select value={plan} onValueChange={(v) => setPlan(v as PaidPlan)}>
          <SelectTrigger className="w-full">
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
        <Label htmlFor="activate-months">
          {t("admin.subscriptions.activateMonths")}
        </Label>
        <Input
          id="activate-months"
          inputMode="numeric"
          value={months}
          onChange={(e) => setMonths(e.target.value.replace(/\D/g, ""))}
          placeholder="1"
          className="tabular"
        />
        <p className="text-xs text-muted-foreground">
          {t("admin.subscriptions.activateMonthsHint")}
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="activate-note">
          {t("admin.subscriptions.activateNote")}
        </Label>
        <Input
          id="activate-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("admin.subscriptions.activateNotePlaceholder")}
          maxLength={200}
        />
      </div>

      <p className="text-xs text-warning">
        {target.active && target.until
          ? t("seller.subscription.warnUpgrade", {
              date: formatDate(target.until, locale),
            })
          : t("seller.subscription.warnBurn", {
              credits: formatNumber(target.subscriptionCredits, locale),
            })}
      </p>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={activate.isPending}>
          {t("common.cancel")}
        </Button>
        <Button onClick={submit} disabled={activate.isPending || !validMonths}>
          {activate.isPending
            ? t("common.running")
            : t("admin.subscriptions.activate")}
        </Button>
      </DialogFooter>
    </>
  );
}
