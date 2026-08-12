"use client";

import { ChatPanel } from "@/components/chat/chat-panel";
import { useT } from "@/components/providers/i18n-provider";

/**
 * Переписка с покупателями в кабинете продавца.
 *
 * Ровно тот же раздел, что и у покупателя, но со стороны магазина: список
 * разговоров и лента выбранного. Это же место станет домом для ИИ-автоответов —
 * они появятся в ленте как сообщения от магазина с пометкой.
 */
export default function SellerMessages() {
  const { t } = useT();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold tracking-tight">
          {t("seller.nav.messages")}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {t("chat.sellerSubtitle")}
        </p>
      </div>

      <ChatPanel role="seller" className="h-[70vh] min-h-100" />
    </div>
  );
}
