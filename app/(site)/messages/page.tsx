import type { Metadata } from "next";
import { MessagesView } from "@/components/chat/messages-view";

// Личная переписка: индексировать нечего, у каждого своя.
export const metadata: Metadata = {
  title: "Сообщения",
  robots: { index: false, follow: true },
};

export default function MessagesPage() {
  return <MessagesView />;
}
