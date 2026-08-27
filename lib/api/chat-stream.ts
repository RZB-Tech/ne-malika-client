"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "./mutator";
import { getAccessToken } from "./token-store";
import { useAuth } from "./auth";
import { CHATS_KEY } from "./chats";

const RETRY_BASE_MS = 1_000;
const RETRY_MAX_MS = 15_000;

const STALE_MS = 60_000;

export function useChatStream(): void {
  const queryClient = useQueryClient();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;

    let attempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let current: AbortController | null = null;
    let lastFrameAt = 0;

    const invalidate = () => {
      void queryClient.invalidateQueries({ queryKey: [CHATS_KEY] });
    };

    const connect = async () => {
      const token = getAccessToken();
      if (!token) throw new NoTokenYet();

      const ac = new AbortController();
      current = ac;

      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chats/stream`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "text/event-stream",
          },
          signal: ac.signal,
          credentials: "include",
        });

        if (!response.ok || !response.body) {
          throw new Error(`поток не открылся: ${response.status}`);
        }

        attempt = 0;
        lastFrameAt = Date.now();

        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let buffer = "";

        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;

          lastFrameAt = Date.now();
          buffer += value;
          const frames = buffer.split("\n\n");
          buffer = frames.pop() ?? "";

          for (const frame of frames) {
            const line = frame.split("\n").find((part) => part.startsWith("data:"));
            if (!line) continue;

            const payload = safeParse(line.slice(5).trim());
            if (payload?.kind === "message" || payload?.kind === "read") {
              invalidate();
            }
          }
        }
      } finally {
        if (current === ac) current = null;
      }
    };

    const schedule = (delay: number) => {
      if (stopped) return;
      clearTimeout(retryTimer);
      retryTimer = setTimeout(run, delay);
    };

    function run() {
      if (stopped || current) return;

      connect()
        .then(() => schedule(RETRY_BASE_MS))
        .catch((err: unknown) => {
          if (err instanceof NoTokenYet) {
            schedule(RETRY_BASE_MS);
            return;
          }
          const delay = Math.min(RETRY_BASE_MS * 2 ** attempt, RETRY_MAX_MS);
          attempt += 1;
          schedule(delay);
        });
    }

    const wake = () => {
      if (stopped || document.visibilityState !== "visible") return;

      if (current) {
        if (Date.now() - lastFrameAt < STALE_MS) return;
        current.abort();
        return;
      }

      attempt = 0;
      schedule(0);
    };

    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake);

    run();

    return () => {
      stopped = true;
      clearTimeout(retryTimer);
      current?.abort();
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake);
    };
  }, [isAuthenticated, isHydrated, queryClient]);
}

class NoTokenYet extends Error {}

function safeParse(raw: string): { kind?: string } | null {
  try {
    return JSON.parse(raw) as { kind?: string };
  } catch {
    return null;
  }
}
