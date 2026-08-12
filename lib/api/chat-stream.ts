"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "./mutator";
import { getAccessToken } from "./token-store";
import { useAuth } from "./auth";
import { CHATS_KEY } from "./chats";

/**
 * Живой канал переписки.
 *
 * Сервер сам сообщает вкладке, что в чате появилось сообщение или что
 * собеседник прочитал прежние, — и лента обновляется тут же, а не с очередным
 * опросом. Опрос при этом никуда не делся: он редкий и служит страховкой на
 * случай, если соединение оборвалось незаметно.
 *
 * Читаем поток через `fetch`, а не `EventSource`: последний не умеет слать
 * заголовки, и токен пришлось бы тащить в адресной строке — а оттуда он попадёт
 * и в логи прокси, и в историю браузера.
 */

/** Пауза перед новой попыткой. Растёт, но не бесконечно. */
const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 30_000;

export function useChatStream(): void {
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    const controller = new AbortController();
    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_KEY] });
    };

    const connect = async () => {
      const token = getAccessToken();
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/api/v1/chats/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        signal: controller.signal,
        credentials: "include",
      });

      if (!response.ok || !response.body) {
        throw new Error(`поток не открылся: ${response.status}`);
      }

      // Соединение живо — счётчик попыток можно обнулить: следующий разрыв
      // должен переподключаться быстро, а не через полминуты.
      attempt = 0;

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        // Кадр SSE заканчивается пустой строкой; последний кусок может быть
        // обрезан на полуслове — он останется в буфере до следующего чтения.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame
            .split("\n")
            .find((part) => part.startsWith("data:"));
          if (!line) continue;

          const payload = safeParse(line.slice(5).trim());
          // «ping» — только чтобы прокси не закрыл молчащее соединение.
          if (payload?.kind === "message" || payload?.kind === "read") {
            invalidate();
          }
        }
      }
    };

    const run = () => {
      if (stopped) return;
      connect().catch(() => undefined).finally(() => {
        if (stopped) return;
        const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
        attempt += 1;
        retryTimer = setTimeout(run, delay);
      });
    };

    run();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      controller.abort();
    };
  }, [isAuthenticated, isHydrated, queryClient]);
}

function safeParse(raw: string): { kind?: string } | null {
  try {
    return JSON.parse(raw) as { kind?: string };
  } catch {
    return null;
  }
}
