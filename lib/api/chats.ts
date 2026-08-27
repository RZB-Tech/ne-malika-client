"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export const CHATS_KEY = "/api/v1/chats";

const THREAD_POLL_MS = 20_000;
const UNREAD_POLL_MS = 60_000;

export type ChatRole = ChatsControllerListRole;

export function useChats(role: ChatRole, enabled = true) {
  const { isAuthenticated, isHydrated } = useAuth();

  return useQuery<PaginatedChatsDto>({
    queryKey: [CHATS_KEY, "list", role] as const,
    queryFn: ({ signal }) => chatsControllerList({ role, limit: 50 }, undefined, signal),
    enabled: enabled && isHydrated && isAuthenticated,
    refetchInterval: UNREAD_POLL_MS,
  });
}

export function useChatMessages(chatId: number | null) {
  return useQuery<PaginatedChatMessagesDto>({
    queryKey: [CHATS_KEY, "messages", chatId] as const,
    queryFn: ({ signal }) => chatsControllerMessages(chatId!, { limit: 100 }, undefined, signal),
    enabled: chatId !== null,
    refetchInterval: THREAD_POLL_MS,
  });
}

export function useChatUnread() {
  const { isAuthenticated, isHydrated } = useAuth();

  return useQuery({
    queryKey: [CHATS_KEY, "unread"] as const,
    queryFn: ({ signal }) => chatsControllerUnread(undefined, signal),
    enabled: isHydrated && isAuthenticated,
    refetchInterval: UNREAD_POLL_MS,
  });
}

function useInvalidateChats() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [CHATS_KEY] });
}

export function useSendMessage(chatId: number | null, side: ChatRole) {
  const queryClient = useQueryClient();
  const messagesKey = [CHATS_KEY, "messages", chatId] as const;

  return useMutation({
    mutationFn: (text: string) => chatsControllerSend(chatId!, { text: text.trim() }),

    onMutate: (text: string) => {
      const previous = queryClient.getQueryData<PaginatedChatMessagesDto>(messagesKey);

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

      void queryClient.cancelQueries({ queryKey: messagesKey });

      return { previous, pendingId };
    },

    onSuccess: (message, _text, context) => {
      queryClient.setQueryData<PaginatedChatMessagesDto>(
        messagesKey,
        (old) =>
          old && {
            ...old,
            data: old.data.map((row) => (row.id === context?.pendingId ? message : row)),
          },
      );
    },

    onError: (_error, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(messagesKey, context.previous);
      }
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_KEY, "list"] });
      void queryClient.invalidateQueries({ queryKey: [CHATS_KEY, "unread"] });
    },
  });
}

export function useStartChat() {
  const invalidate = useInvalidateChats();

  return useMutation({
    mutationFn: (input: { productCardId?: number; shopId?: number; text: string }) =>
      chatsControllerStart({ ...input, text: input.text.trim() }),
    onSuccess: invalidate,
  });
}
