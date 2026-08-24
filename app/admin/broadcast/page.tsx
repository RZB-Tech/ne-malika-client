"use client";

import { useState } from "react";
import { Send } from "@/components/icons";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { TelegramLinkCard } from "@/components/shared/telegram-link-card";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/components/admin/use-admin-mutation";
import {
  getAdminBroadcastsControllerCountQueryKey,
  getAdminBroadcastsControllerListQueryKey,
  useAdminBroadcastsControllerCount,
  useAdminBroadcastsControllerList,
  useAdminBroadcastsControllerSend,
} from "@/lib/api/generated/endpoints/broadcasts-admin/broadcasts-admin";
import type { CreateBroadcastDtoAudience } from "@/lib/api/generated/schemas";
import { useT } from "@/components/providers/i18n-provider";
import { formatDate } from "@/lib/format";

const AUDIENCES = [
  { value: "all", labelKey: "admin.broadcast.audienceAll" },
  { value: "sellers", labelKey: "admin.broadcast.audienceSellers" },
  { value: "buyers", labelKey: "admin.broadcast.audienceBuyers" },
] as const satisfies readonly {
  value: CreateBroadcastDtoAudience;
  labelKey: string;
}[];

interface BroadcastRow {
  id: number;
  audience: CreateBroadcastDtoAudience;
  text: string;
  recipients: number;
  delivered: number;
  failed: number;
  createdAt: string;
  authorName: string | null;
}

export default function AdminBroadcast() {
  const { t, locale } = useT();
  const run = useAdminMutation();
  const [audience, setAudience] =
    useState<CreateBroadcastDtoAudience>("sellers");
  const [text, setText] = useState("");

  const countQuery = useAdminBroadcastsControllerCount(
    { audience },
    { query: { retry: false } },
  );
  const historyQuery = useAdminBroadcastsControllerList(
    { limit: 20 },
    { query: { retry: false } },
  );
  const sendMutation = useAdminBroadcastsControllerSend();

  const audienceCount = countQuery.data as unknown as
    | { count?: number; push?: number }
    | undefined;
  const count = audienceCount?.count ?? 0;
  const pushCount = audienceCount?.push ?? 0;
  const countFailed = countQuery.isError;
  const noRecipients = countQuery.isSuccess && count === 0;
  const history =
    ((historyQuery.data as unknown as { data?: BroadcastRow[] })?.data ?? []);

  const send = async () => {
    const value = text.trim();
    if (value.length < 5) {
      toast.error(t("admin.broadcast.tooShort"));
      return;
    }
    let res: { id: number; recipients: number } | undefined;
    const ok = await run(
      async () => {
        res = (await sendMutation.mutateAsync({
          data: { audience, text: value },
        })) as unknown as { id: number; recipients: number };
      },
      {
        invalidate: [
          getAdminBroadcastsControllerListQueryKey(),
          getAdminBroadcastsControllerCountQueryKey(),
        ],
        errorKey: "admin.broadcast.failed",
      },
    );
    if (!ok || !res) return;
    toast.success(
      t("admin.broadcast.started", { recipients: res.recipients }),
    );
    setText("");
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={t("admin.broadcast.title")}
        subtitle={t("admin.broadcast.subtitle")}
      />

      <TelegramLinkCard />

      <Card className="flex flex-col gap-5 p-6">
        <div className="grid gap-4 sm:grid-cols-[220px_1fr] sm:items-end">
          <div className="space-y-1.5">
            <Label>{t("admin.broadcast.audience")}</Label>
            <Select
              value={audience}
              onValueChange={(v) =>
                setAudience(v as CreateBroadcastDtoAudience)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {t(a.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <p
              className={
                countFailed || noRecipients
                  ? "text-sm text-destructive"
                  : "tabular text-sm text-muted-foreground"
              }
            >
              {countQuery.isLoading
                ? t("common.loading")
                : countFailed
                  ? t("admin.broadcast.countFailed")
                  : noRecipients
                    ? t("admin.broadcast.recipientsNone")
                    : t("admin.broadcast.recipients", { count })}
            </p>
            {!countQuery.isLoading && !countFailed && (
              <p className="tabular text-sm text-muted-foreground">
                {t("admin.broadcast.recipientsPush", { push: pushCount })}
              </p>
            )}
            {countFailed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void countQuery.refetch()}
              >
                {t("admin.imageGen.retry")}
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="broadcast-text">{t("admin.broadcast.text")}</Label>
          <Textarea
            id="broadcast-text"
            rows={6}
            maxLength={4096}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("admin.broadcast.textPlaceholder")}
          />
          <p className="text-xs text-muted-foreground">
            {t("admin.broadcast.textHint")}
          </p>
        </div>

        <ConfirmDialog
          title={t("admin.broadcast.confirmTitle")}
          description={t("admin.broadcast.confirmText", { count })}
          confirmLabel={t("admin.broadcast.send")}
          onConfirm={send}
        >
          <Button
            type="button"
            className="gap-2 self-start"
            disabled={
              sendMutation.isPending || (noRecipients && pushCount === 0)
            }
          >
            <Send className="size-4" />
            {t(
              sendMutation.isPending
                ? "admin.broadcast.sending"
                : "admin.broadcast.send",
            )}
          </Button>
        </ConfirmDialog>
      </Card>

      <div>
        <h2 className="mb-3 font-heading text-lg font-bold tracking-tight">
          {t("admin.broadcast.history")}
        </h2>

        <Card className="overflow-hidden p-0">
          {historyQuery.isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              {t("admin.broadcast.historyEmpty")}
            </div>
          ) : (
            <Table className="min-w-[760px] table-fixed">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-44">
                      {t("admin.broadcast.colDate")}
                    </TableHead>
                    <TableHead className="w-32">
                      {t("admin.broadcast.colAudience")}
                    </TableHead>
                    <TableHead>
                      {t("admin.broadcast.colText")}
                    </TableHead>
                    <TableHead className="w-28 text-right">
                      {t("admin.broadcast.colResult")}
                    </TableHead>
                    <TableHead className="w-28">
                      {t("admin.broadcast.colAuthor")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="tabular whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(row.createdAt, locale)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {t(
                          AUDIENCES.find((a) => a.value === row.audience)
                            ?.labelKey ?? "admin.broadcast.audienceAll",
                        )}
                      </TableCell>
                      <TableCell className="whitespace-normal text-sm">
                        <span
                          className="line-clamp-2 break-words"
                          title={row.text}
                        >
                          {row.text}
                        </span>
                      </TableCell>
                      <TableCell className="tabular whitespace-nowrap text-right text-sm">
                        {row.delivered} / {row.recipients}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.authorName ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
