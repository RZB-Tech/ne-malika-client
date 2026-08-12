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
  ChatMessageDto,
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

/**
 * Отправка сообщения.
 *
 * Реплика встаёт в ленту сразу, не дожидаясь ответа сервера. Раньше она ждала
 * два круга: POST, а следом полную перезагрузку ленты по инвалидации — и на
 * телефоне это выглядело как «сообщение отправляется секунду-две». Сервер
 * ничего не решает о содержимом: текст уже известен, id и время он лишь
 * проставит, и настоящий ответ подменит временную запись на месте.
 *
 * `side` нужен, чтобы пузырь сразу встал на свою сторону: лента различает
 * своё и чужое по `kind`.
 */
export function useSendMessage(chatId: number | null, side: ChatRole) {
  const queryClient = useQueryClient();
  const messagesKey = [CHATS_KEY, "messages", chatId] as const;

  return useMutation({
    mutationFn: (text: string) =>
      chatsControllerSend(chatId!, { text: text.trim() }),

    onMutate: (text: string) => {
      const previous =
        queryClient.getQueryData<PaginatedChatMessagesDto>(messagesKey);

      /** Отрицательный id не столкнётся с настоящим и виден в отладке как временный. */
      const pendingId = -Date.now();
      const pending: ChatMessageDto = {
        id: pendingId,
        kind: side,
        text: text.trim(),
        readAt: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PaginatedChatMessagesDto>(
        messagesKey,
        (old) => old && { ...old, data: [pending, ...old.data] },
      );

      /**
       * Отменяем уже начатую загрузку ленты, но не ждём её: ответ на запрос,
       * ушедший до нажатия, не знает о новой реплике и стёр бы её. Ожидание
       * же здесь стоило секунды — ровно той задержки, ради которой всё
       * и затевалось.
       */
      void queryClient.cancelQueries({ queryKey: messagesKey });

      return { previous, pendingId };
    },

    onSuccess: (message, _text, context) => {
      queryClient.setQueryData<PaginatedChatMessagesDto>(
        messagesKey,
        (old) =>
          old && {
            ...old,
            data: old.data.map((row) =>
              row.id === context?.pendingId ? message : row,
            ),
          },
      );
    },

    /** Не дошло — убираем пузырь, иначе человек считает сообщение отправленным. */
    onError: (_error, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
    },

    /**
     * Ленту не трогаем — она уже точная. Обновляем только список переписок и
     * счётчики: там поменялись последняя реплика и время.
     */
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_KEY, "list"] });
      void queryClient.invalidateQueries({ queryKey: [CHATS_KEY, "unread"] });
    },
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
