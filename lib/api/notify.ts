"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "./mutator";
import { useAuth } from "./auth";

export interface PushChannel {
  available: boolean;
  publicKey: string | null;
  subscribed: boolean;
}

export interface TelegramChannel {
  available: boolean;
  linked: boolean;
  enabled: boolean;
  url: string | null;
}

export interface NotificationChannels {
  push: PushChannel;
  telegram: TelegramChannel;
}

export const CHANNELS_KEY = "/api/v1/notifications/channels";
const TELEGRAM_URL = "/api/v1/notifications/telegram";

export function useNotificationChannels(enabled = true) {
  const { isAuthenticated, isHydrated } = useAuth();

  return useQuery<NotificationChannels>({
    queryKey: [CHANNELS_KEY] as const,
    queryFn: async ({ signal }) => {
      const { data } = await axiosInstance.get<NotificationChannels>(CHANNELS_KEY, { signal });
      return data;
    },
    enabled: enabled && isHydrated && isAuthenticated,
    staleTime: 0,
  });
}

export function useSetTelegramNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const { data } = await axiosInstance.patch<NotificationChannels>(TELEGRAM_URL, { enabled });
      return data;
    },
    onSuccess: (data) => queryClient.setQueryData([CHANNELS_KEY], data),
  });
}
