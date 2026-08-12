"use client";

import { useState } from "react";
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
  onActiveChange,
}: {
  role: ChatRole;
  className?: string;
  /**
   * Открыта ли переписка. Нужно странице: на телефоне она прячет свою строку
   * заголовка, чтобы над разговором не стояло двух шапок подряд.
   */
  onActiveChange?: (open: boolean) => void;
}) {
  const { t } = useT();
  const { data, isPending } = useChats(role);
  const [activeId, setActiveId] = useState<number | null>(null);

  const chats = data?.data ?? [];
  // Ищем в свежем списке, а не храним объект: счётчик непрочитанного и
  // последнее сообщение обновляются опросом, и сохранённая копия устарела бы.
  const active = chats.find((chat) => chat.id === activeId) ?? null;

  const select = (id: number | null) => {
    setActiveId(id);
    onActiveChange?.(id !== null);
  };

  return (
    // Высоту задаёт вызывающий: на телефоне это весь экран, в кабинете
    // продавца — часть страницы. Зашитая сюда, она в одном из мест обязательно
    // мешала бы.
    <div
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border bg-card",
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
          onSelect={(chat) => select(chat.id)}
          isLoading={isPending}
        />
      </div>

      <div className={cn("min-w-0 flex-1", active ? "flex" : "hidden md:flex")}>
        {active ? (
          // Возврат к списку — стрелкой в самой шапке переписки, а не отдельной
          // полосой над ней: две строки подряд с одинаковым смыслом занимают
          // десятую часть экрана телефона и ничего не добавляют.
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

/** Тип собеседника наружу — им пользуется страница кабинета продавца. */
export type { ChatDto };
