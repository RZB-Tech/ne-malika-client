"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  chatsControllerList,
  chatsControllerMessages,
  chatsControllerSend,
  chatsControllerStart,
  chatsControllerUnread,
} from "@/lib/api/generated/endpoints/chats/chats";
import type {
  ChatsControllerListRole,
  PaginatedChatMessagesDto,
  PaginatedChatsDto,
} from "@/lib/api/generated/schemas";
import { useAuth } from "@/lib/api/auth";

/**
 * Переписка с продавцом.
 *
 * Живого канала (websocket) нет — вместо него опрос, и это осознанно: свой
 * сокет ради нескольких сообщений в день потянул бы за собой отдельный сервер
 * состояний, а разговор о товаре не биржевые котировки.
 */

export const CHATS_KEY = "/api/v1/chats";

/**
 * Опрос — страховка, а не основной канал: о новых сообщениях вкладке сообщает
 * живой поток (`useChatStream`). Сюда попадают только те случаи, когда поток
 * оборвался незаметно, поэтому интервалы редкие.
 */
const THREAD_POLL_MS = 20_000;
const UNREAD_POLL_MS = 60_000;

export type ChatRole = ChatsControllerListRole;

/** Список переписок: своих как покупателя или магазина как продавца. */
export function useChats(role: ChatRole, enabled = true) {
  const { isAuthenticated, isHydrated } = useAuth();

  return useQuery<PaginatedChatsDto>({
    queryKey: [CHATS_KEY, "list", role] as const,
    queryFn: ({ signal }) =>
      chatsControllerList({ role, limit: 50 }, undefined, signal),
    enabled: enabled && isHydrated && isAuthenticated,
    refetchInterval: UNREAD_POLL_MS,
  });
}

/**
 * Лента одной переписки. Запрос отмечает входящие прочитанными на бэкенде,
 * поэтому опрос идёт, только пока переписка открыта (`chatId !== null`).
 */
export function useChatMessages(chatId: number | null) {
  return useQuery<PaginatedChatMessagesDto>({
    queryKey: [CHATS_KEY, "messages", chatId] as const,
    queryFn: ({ signal }) =>
      chatsControllerMessages(chatId!, { limit: 100 }, undefined, signal),
    enabled: chatId !== null,
    refetchInterval: THREAD_POLL_MS,
  });
}

/** Сколько непрочитанного в обеих ролях — для значков в меню. */
export function useChatUnread() {
  const { isAuthenticated, isHydrated } = useAuth();

  return useQuery({
    queryKey: [CHATS_KEY, "unread"] as const,
    queryFn: ({ signal }) => chatsControllerUnread(undefined, signal),
    enabled: isHydrated && isAuthenticated,
    refetchInterval: UNREAD_POLL_MS,
  });
}

/** Сброс всего, что связано с перепиской: списки, лента и счётчики. */
function useInvalidateChats() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHATS_KEY] });
}

export function useSendMessage(chatId: number | null) {
  const invalidate = useInvalidateChats();

  return useMutation({
    mutationFn: (text: string) =>
      chatsControllerSend(chatId!, { text: text.trim() }),
    onSuccess: invalidate,
  });
}

/**
 * Первое сообщение продавцу. Возвращает id переписки — начатой сейчас или
 * найденной: спрашивать об одном товаре дважды человек может, а вторая пустая
 * переписка об этом же товаре никому не нужна.
 */
export function useStartChat() {
  const invalidate = useInvalidateChats();

  return useMutation({
    mutationFn: (input: {
      productCardId?: number;
      shopId?: number;
      text: string;
    }) => chatsControllerStart({ ...input, text: input.text.trim() }),
    onSuccess: invalidate,
  });
}
