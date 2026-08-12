"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "./mutator";
import { useAuth } from "./auth";

/**
 * Куда человек получает уведомления: в браузер или в Telegram.
 *
 * Написано вручную, а не сгенерировано orval, по той же причине, что и
 * `push.ts`: генератору нужен поднятый бэкенд со спецификацией, а этот кусок
 * должен работать и до следующей регенерации. Форма ответа повторяет
 * `NotificationChannelsDto` на сервере.
 */

export interface PushChannel {
  /** Настроены ли ключи VAPID. Без них канал недоступен вообще никому. */
  available: boolean;
  publicKey: string | null;
  /** Подписано ли хоть одно устройство этого человека — не обязательно текущее. */
  subscribed: boolean;
}

export interface TelegramChannel {
  available: boolean;
  /** Открыт ли чат с ботом: без него включать нечего. */
  linked: boolean;
  enabled: boolean;
  /** Готовая ссылка на бота — username знает только сервер. */
  url: string | null;
}

export interface NotificationChannels {
  push: PushChannel;
  telegram: TelegramChannel;
}

export const CHANNELS_KEY = "/api/v1/notifications/channels";
const TELEGRAM_URL = "/api/v1/notifications/telegram";

/**
 * Состояние каналов.
 *
 * `staleTime` нулевой намеренно: включение Telegram происходит в другом
 * приложении, и единственный момент, когда мы можем узнать о нём, — возвращение
 * на вкладку. Запрос дешёвый, а устаревшая карточка предлагала бы включить уже
 * включённое.
 */
export function useNotificationChannels(enabled = true) {
  const { isAuthenticated, isHydrated } = useAuth();

  return useQuery<NotificationChannels>({
    queryKey: [CHANNELS_KEY] as const,
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<NotificationChannels>(
        CHANNELS_KEY,
        { signal },
      );
      return data;
    },
    enabled: enabled && isHydrated && isAuthenticated,
    staleTime: 0,
  });
}

/** Переключатель Telegram. Ответ — свежее состояние обоих каналов. */
export function useSetTelegramNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await axiosInstance.patch<NotificationChannels>(
        TELEGRAM_URL,
        { enabled },
      );
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData([CHANNELS_KEY], data),
  });
}
