import { customInstance } from "./mutator";

export interface AssistantProduct {
  id: number;
  name: string;
  price: string | null;
  state: "new" | "old";
  shopName: string;
  photo: string | null;
}

export interface AssistantReply {
  message: string;
  products: AssistantProduct[];
  suggestions: string[];
  links: { label: string; href: string }[];
}

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
  reply?: AssistantReply;
}

export function askAssistant(
  messages: Pick<AssistantMessage, "role" | "content">[],
  productIds: number[],
  signal: AbortSignal,
) {
  return customInstance<AssistantReply>({
    url: "/api/v1/assistant/chat",
    method: "POST",
    data: { messages, productIds },
    signal,
    timeout: 50_000,
  });
}
