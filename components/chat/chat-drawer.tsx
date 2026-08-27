"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare } from "@/components/icons";
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
import { ChatConversationHeader } from "./chat-conversation-header";
import { cn } from "@/lib/utils";

export function ChatDrawer({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated, isHydrated, isSeller } = useAuth();
  const [open, setOpen] = useState(false);

  if (!isHydrated || !isAuthenticated) {
    return <LoginDialog redirectTo={null}>{children}</LoginDialog>;
  }

  return (
    <Drawer direction="right" open={open} onOpenChange={setOpen} handleOnly>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent className={cn("flex flex-col p-0 sm:max-w-md", className)}>
        <DrawerBody side={isSeller ? "seller" : "buyer"} onClose={() => setOpen(false)} />
      </DrawerContent>
    </Drawer>
  );
}

function DrawerBody({ side, onClose }: { side: "buyer" | "seller"; onClose: () => void }) {
  const { t } = useT();
  const { data, isPending } = useChats(side);
  const [activeId, setActiveId] = useState<number | null>(null);

  const chats = data?.data ?? [];
  const active = chats.find((chat) => chat.id === activeId) ?? null;

  return (
    <>
      {active ? (
        <>
          <DrawerHeader className="sr-only">
            <DrawerTitle>{side === "seller" ? active.buyerName : active.shopName}</DrawerTitle>
          </DrawerHeader>
          <ChatConversationHeader
            chat={active}
            side={side}
            onBack={() => setActiveId(null)}
            onNavigate={onClose}
          />
        </>
      ) : (
        <DrawerHeader className="flex-row items-center gap-2 border-b border-border p-3 text-left">
          <MessageSquare className="ml-1 size-5 text-primary" />
          <DrawerTitle className="min-w-0 flex-1 truncate text-base">
            {t("nav.messages")}
          </DrawerTitle>
        </DrawerHeader>
      )}

      {active ? (
        <ChatThread chat={active} side={side} className="min-h-0 flex-1" hideHeader />
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

          {chats.length > 0 && side === "buyer" && (
            <div className="border-t border-border p-3">
              <Button asChild variant="outline" className="w-full" onClick={onClose}>
                <Link href="/messages">{t("chat.openAll")}</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
}

export function useBuyerUnread(): number {
  const { isSeller } = useAuth();
  const unread = useChatUnread().data;
  return (isSeller ? unread?.seller : unread?.buyer) ?? 0;
}
