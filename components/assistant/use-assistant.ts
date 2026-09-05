"use client";

import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { askAssistant, type AssistantMessage } from "@/lib/api/assistant";
import {
  isAssistantReply,
  readConversation,
  requestHistory,
  saveConversation,
} from "@/lib/assistant/conversation";
import type { Locale } from "@/lib/i18n/config";

export function useAssistant(locale: Locale, pathname: string) {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ text: string; status?: number } | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    // Restore only after hydration, including browsers that disable storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(readConversation(locale));
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [locale]);

  async function send(value: string) {
    const text = value.trim().slice(0, 2000);
    if (!text || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setPending(text);
    setFailed(null);
    const pageId = /^\/product\/(\d+)\/?$/.exec(pathname)?.[1];
    const recentProducts = messages
      .flatMap((message) => message.reply?.products ?? [])
      .slice(-4)
      .map((product) => product.id);
    const productIds = [...new Set([...(pageId ? [Number(pageId)] : []), ...recentProducts])];
    try {
      const reply = await askAssistant(
        requestHistory(messages, text),
        productIds,
        controller.signal,
      );
      if (request.current !== controller) return;
      if (!isAssistantReply(reply)) throw new Error("Invalid assistant response");
      const next: AssistantMessage[] = [
        ...messages,
        { role: "user", content: text },
        { role: "assistant", content: reply.message, reply },
      ].slice(-12) as AssistantMessage[];
      setMessages(next);
      saveConversation(locale, next);
    } catch (error) {
      if (request.current === controller && !controller.signal.aborted) {
        setFailed({ text, status: isAxiosError(error) ? error.response?.status : undefined });
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setPending(null);
      }
    }
  }

  function reset() {
    request.current?.abort();
    request.current = null;
    setPending(null);
    setFailed(null);
    setMessages([]);
    saveConversation(locale, []);
  }

  return { messages, pending, failed, send, reset };
}
