import type { Metadata } from "next";
import { MessagesView } from "@/components/chat/messages-view";

export const metadata: Metadata = {
  title: "Сообщения",
  robots: { index: false, follow: true },
};

export default function MessagesPage() {
  return <MessagesView />;
}
