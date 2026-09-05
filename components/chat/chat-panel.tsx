"use client";

import { useState } from "react";
import { useT } from "@/components/providers/i18n-provider";
import { useChats, type ChatRole } from "@/lib/api/chats";
import { ChatList } from "./chat-list";
import { ChatThread } from "./chat-thread";
import { cn } from "@/lib/utils";

export function ChatPanel({
  role,
  className,
  onActiveChange,
}: {
  role: ChatRole;
  className?: string;
  onActiveChange?: (open: boolean) => void;
}) {
  const { t } = useT();
  const { data, isPending } = useChats(role);
  const [activeId, setActiveId] = useState<number | null>(null);

  const chats = data?.data ?? [];
  const active = chats.find((chat) => chat.id === activeId) ?? null;

  const select = (id: number | null) => {
    setActiveId(id);
    onActiveChange?.(id !== null);
  };

  return (
    <div className={cn("flex overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto md:w-80 md:border-r md:border-border",
          active ? "hidden md:block" : "block",
        )}
      >
        <ChatList
          chats={chats}
          side={role}
          activeId={activeId}
          onSelect={(chat) => select(chat.id)}
          isLoading={isPending}
        />
      </div>

      <div className={cn("min-w-0 flex-1", active ? "flex" : "hidden md:flex")}>
        {active ? (
          <ChatThread
            chat={active}
            side={role}
            onBack={() => select(null)}
            className="min-h-0 w-full"
          />
        ) : (
          <p className="m-auto px-6 text-center text-sm text-muted-foreground">
            {t("chat.pickChat")}
          </p>
        )}
      </div>
    </div>
  );
}
