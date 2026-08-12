"use client";

import { useState } from "react";
import { ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { useChats, type ChatRole } from "@/lib/api/chats";
import type { ChatDto } from "@/lib/api/generated/schemas";
import { ChatList } from "./chat-list";
import { ChatThread } from "./chat-thread";
import { cn } from "@/lib/utils";

/**
 * Раздел «Сообщения»: слева список разговоров, справа выбранный.
 *
 * Один компонент на оба кабинета — покупателя и продавца: различие сводится к
 * роли, с которой запрашивается список, и к тому, кто считается собеседником.
 *
 * На телефоне две колонки не помещаются, поэтому там это две страницы в одной:
 * список либо переписка, с кнопкой «назад». Отдельный маршрут ради этого не
 * нужен — состояние живёт ровно столько, сколько раздел открыт.
 */
export function ChatPanel({
  role,
  className,
}: {
  role: ChatRole;
  className?: string;
}) {
  const { t } = useT();
  const { data, isPending } = useChats(role);
  const [activeId, setActiveId] = useState<number | null>(null);

  const chats = data?.data ?? [];
  // Ищем в свежем списке, а не храним объект: счётчик непрочитанного и
  // последнее сообщение обновляются опросом, и сохранённая копия устарела бы.
  const active = chats.find((chat) => chat.id === activeId) ?? null;

  return (
    <div
      className={cn(
        "flex h-[70vh] min-h-100 overflow-hidden rounded-2xl border border-border bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "w-full shrink-0 overflow-y-auto md:w-80 md:border-r md:border-border",
          // На телефоне список уступает место переписке целиком.
          active ? "hidden md:block" : "block",
        )}
      >
        <ChatList
          chats={chats}
          side={role}
          activeId={activeId}
          onSelect={(chat) => setActiveId(chat.id)}
          isLoading={isPending}
        />
      </div>

      <div className={cn("min-w-0 flex-1", active ? "flex" : "hidden md:flex")}>
        {active ? (
          <div className="flex min-h-0 w-full flex-col">
            <div className="border-b border-border p-2 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveId(null)}
                className="gap-1.5"
              >
                <ArrowLeft className="size-4" />
                {t("chat.backToList")}
              </Button>
            </div>
            <ChatThread chat={active} side={role} className="flex-1" />
          </div>
        ) : (
          <p className="m-auto px-6 text-center text-sm text-muted-foreground">
            {t("chat.pickChat")}
          </p>
        )}
      </div>
    </div>
  );
}

/** Тип собеседника наружу — им пользуется страница кабинета продавца. */
export type { ChatDto };
