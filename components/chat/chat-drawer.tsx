"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/lib/api/auth";
import { useChatUnread, useChats } from "@/lib/api/chats";
import { ChatList } from "./chat-list";
import { ChatThread } from "./chat-thread";
import { cn } from "@/lib/utils";

/**
 * Переписка из шапки: панель выезжает справа, в ней список разговоров, а по
 * нажатию — сам разговор с полем ответа.
 *
 * Панель, а не отдельная страница: покупатель отвечает продавцу между делом —
 * листая каталог или стоя на карточке товара, — и уводить его со страницы ради
 * двух реплик незачем. Полная страница остаётся: на неё ведёт нижняя панель на
 * телефоне и ссылка отсюда.
 */
export function ChatDrawer({
  className,
  children,
}: {
  className?: string;
  /** Кнопка-открывашка. Своя у шапки, своя у нижней панели. */
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, isSeller } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isHydrated || !isAuthenticated) {
    return <LoginDialog redirectTo={null}>{children}</LoginDialog>;
  }

  return (
    <Drawer
      direction="right"
      open={open}
      onOpenChange={setOpen}
      handleOnly
    >
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        className={cn("flex flex-col p-0 sm:max-w-md", className)}
      >
        <DrawerBody
          side={isSeller ? "seller" : "buyer"}
          onClose={() => setOpen(false)}
        />
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({
  side,
  onClose,
}: {
  side: "buyer" | "seller";
  onClose: () => void;
}) {
  const { t } = useT();
  const { data, isPending } = useChats(side);
  const [activeId, setActiveId] = useState<number | null>(null);

  const chats = data?.data ?? [];
  const active = chats.find((chat) => chat.id === activeId) ?? null;

  return (
    <>
      <DrawerHeader className="flex-row items-center gap-2 border-b border-border p-3">
        {active ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveId(null)}
            aria-label={t("chat.backToList")}
          >
            <ArrowLeft className="size-4" />
          </Button>
        ) : (
          <MessageSquare className="ml-1 size-5 text-primary" />
        )}
        <DrawerTitle className="min-w-0 flex-1 truncate text-base">
          {active
            ? side === "seller"
              ? active.buyerName
              : active.shopName
            : t("nav.messages")}
        </DrawerTitle>
      </DrawerHeader>

      {active ? (
        <ChatThread chat={active} side={side} className="min-h-0 flex-1" />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ChatList
              chats={chats}
              side={side}
              activeId={activeId}
              onSelect={(chat) => setActiveId(chat.id)}
              isLoading={isPending}
            />
          </div>

          {chats.length > 0 && (
            <div className="border-t border-border p-3">
              <Button asChild variant="outline" className="w-full" onClick={onClose}>
                <Link href={side === "seller" ? "/seller/messages" : "/messages"}>
                  {t("chat.openAll")}
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

/** Счётчик непрочитанного для кнопки в шапке. */
export function useBuyerUnread(): number {
  const { isSeller } = useAuth();
  const unread = useChatUnread().data;
  return (isSeller ? unread?.seller : unread?.buyer) ?? 0;
}
