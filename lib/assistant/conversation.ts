import type { AssistantMessage, AssistantReply } from "@/lib/api/assistant";
import type { Locale } from "@/lib/i18n/config";

export const ASSISTANT_SEEN_KEY = "nemalika:assistant:seen:v1";
export const MESSAGE_MAX = 2000;
const MAX_HISTORY = 12;
const MAX_AGE = 24 * 60 * 60 * 1000;
const SAFE_LINKS = new Set(["/", "/stores", "/compare", "/account?tab=favorites", "/messages"]);

export function isAssistantReply(value: unknown): value is AssistantReply {
  if (!value || typeof value !== "object") return false;
  const reply = value as AssistantReply;
  return (
    typeof reply.message === "string" &&
    reply.message.trim().length > 0 &&
    reply.message.length <= MESSAGE_MAX &&
    Array.isArray(reply.suggestions) &&
    reply.suggestions.length <= 3 &&
    reply.suggestions.every((text) => typeof text === "string" && text.length <= 100) &&
    Array.isArray(reply.links) &&
    reply.links.length <= 3 &&
    reply.links.every(
      (link) => link && SAFE_LINKS.has(link.href) && typeof link.label === "string",
    ) &&
    Array.isArray(reply.products) &&
    reply.products.length <= 4 &&
    reply.products.every(
      (product) =>
        product &&
        Number.isSafeInteger(product.id) &&
        product.id > 0 &&
        typeof product.name === "string" &&
        typeof product.shopName === "string" &&
        (product.price === null || typeof product.price === "string") &&
        (product.photo === null || typeof product.photo === "string") &&
        (product.state === "new" || product.state === "old"),
    )
  );
}

export function requestHistory(messages: AssistantMessage[], content: string) {
  const history = messages
    .slice(-MAX_HISTORY)
    .map(({ role, content: text }) => ({ role, content: text }));
  while (history.reduce((sum, message) => sum + message.content.length, content.length) > 18000) {
    history.splice(0, 2);
  }
  return [...history, { role: "user" as const, content }];
}

const storageKey = (locale: Locale) => `nemalika:assistant:conversation:v1:${locale}`;

export function readConversation(locale: Locale): AssistantMessage[] {
  try {
    const raw = sessionStorage.getItem(storageKey(locale));
    if (!raw || raw.length > 100000) return [];
    const saved = JSON.parse(raw) as { at: number; messages: AssistantMessage[] };
    if (
      !Number.isFinite(saved.at) ||
      Date.now() - saved.at > MAX_AGE ||
      !Array.isArray(saved.messages) ||
      saved.messages.length > MAX_HISTORY ||
      saved.messages.length % 2 !== 0
    )
      return [];
    if (
      !saved.messages.every(
        (message, index) =>
          message &&
          message.role === (index % 2 ? "assistant" : "user") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0 &&
          message.content.length <= MESSAGE_MAX &&
          (message.role === "user" || isAssistantReply(message.reply)),
      )
    )
      return [];
    return saved.messages;
  } catch {
    return [];
  }
}

export function saveConversation(locale: Locale, messages: AssistantMessage[]) {
  try {
    if (messages.length)
      sessionStorage.setItem(
        storageKey(locale),
        JSON.stringify({ at: Date.now(), messages: messages.slice(-MAX_HISTORY) }),
      );
    else sessionStorage.removeItem(storageKey(locale));
  } catch {
    /* Chat remains usable when browser storage is unavailable. */
  }
}
