"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { MessageSquare } from "@/components/icons";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useChats, useStartChat } from "@/lib/api/chats";
import { ChatThread } from "./chat-thread";
import { cn } from "@/lib/utils";

/**
 * «Написать в чат» на карточке товара.
 *
 * Рядом с телеграм-кнопкой, а не вместо неё: телеграм остаётся быстрым путём
 * для тех, кто им живёт, а внутренний чат нужен, чтобы разговор о товаре
 * остался на площадке — вместе с карточкой, историей и, со временем, с ИИ,
 * который сможет отвечать за продавца.
 *
 * Гостю кнопка предлагает войти: переписка привязана к человеку, а не к
 * браузеру, иначе продавец отвечал бы в пустоту.
 */
export function WriteToSellerButton({
  productId,
  shopId,
  className,
  size = "default",
  variant = "outline",
}: {
  productId?: number;
  shopId?: number;
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  const { t } = useT();
  const { isAuthenticated, isHydrated } = useAuth();
  const [open, setOpen] = useState(false);

  const label = t("chat.writeToSeller");
  const button = (
    <Button
      type="button"
      size={size}
      variant={variant}
      className={cn("gap-2", className)}
      onClick={isHydrated && isAuthenticated ? () => setOpen(true) : undefined}
    >
      <MessageSquare className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{label}</span>
    </Button>
  );

  if (!isHydrated || !isAuthenticated) {
    return <LoginDialog redirectTo={null}>{button}</LoginDialog>;
  }

  return (
    <>
      {button}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        >
          <ChatSheetBody productId={productId} shopId={shopId} />
        </SheetContent>
      </Sheet>
    </>
  );
}

/**
 * Содержимое окна: либо уже начатая переписка об этом товаре, либо поле для
 * первого сообщения. Список подтягиваем только при открытом окне — на странице
 * товара он больше нигде не нужен.
 */
function ChatSheetBody({
  productId,
  shopId,
}: {
  productId?: number;
  shopId?: number;
}) {
  const { t } = useT();
  const { data, isPending } = useChats("buyer");
  const start = useStartChat();
  const [text, setText] = useState("");

  const chats = data?.data ?? [];
  const existing = chats.find((chat) =>
    productId !== undefined
      ? chat.productCardId === productId
      : chat.shopId === shopId && chat.productCardId === null,
  );

  if (existing) {
    return (
      <>
        <SheetHeader className="sr-only">
          <SheetTitle>{t("chat.writeToSeller")}</SheetTitle>
        </SheetHeader>
        <ChatThread chat={existing} side="buyer" className="flex-1" />
      </>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || start.isPending || isPending) return;

    start.mutate(
      { productCardId: productId, shopId, text: value },
      {
        onSuccess: () => setText(""),
        onError: (error) =>
          toast.error(
            error instanceof Error ? error.message : t("chat.sendFailed"),
          ),
      },
    );
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{t("chat.writeToSeller")}</SheetTitle>
        <SheetDescription>{t("chat.firstMessageHint")}</SheetDescription>
      </SheetHeader>

      <form onSubmit={submit} className="flex flex-col gap-3 p-4">
        <Textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("chat.firstMessagePlaceholder")}
          rows={4}
          maxLength={2000}
        />
        <Button type="submit" disabled={!text.trim() || start.isPending}>
          {start.isPending ? t("common.saving") : t("chat.send")}
        </Button>
      </form>
    </>
  );
}
