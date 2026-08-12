"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { ChatPanel } from "./chat-panel";
import { ChatPushPrompt } from "./chat-push-prompt";
import { cn } from "@/lib/utils";

/**
 * Раздел переписки.
 *
 * На телефоне занимает весь экран поверх витрины — без шапки, подвала и нижней
 * панели: в переписке важна каждая строка, а три полосы служебного обвеса
 * съедают треть экрана. Отсюда `fixed inset-0`, своя строка заголовка с
 * кнопкой назад и никакой прокрутки страницы — прокручивается только лента.
 *
 * На широком экране это обычная страница внутри витрины: место есть, и прятать
 * от человека шапку с поиском незачем.
 */
export function MessagesView() {
  const { t } = useT();
  const [threadOpen, setThreadOpen] = useState(false);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background md:static md:z-auto md:mx-auto md:w-full md:max-w-[1600px] md:px-8 md:py-6 lg:px-10">
      <header
        className={cn(
          "flex items-center gap-1 border-b border-border px-2 py-2 md:hidden",
          threadOpen && "hidden",
        )}
      >
        <Button asChild variant="ghost" size="icon-sm" aria-label={t("common.back")}>
          <Link href="/">
            <ArrowLeft className="size-5" />
          </Link>
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-heading text-lg font-semibold">
          {t("nav.messages")}
        </h1>
      </header>

      <h1 className="hidden font-heading text-2xl font-bold tracking-tight md:block sm:text-3xl">
        {t("nav.messages")}
      </h1>
      <p className="mt-1.5 hidden text-sm text-muted-foreground md:block sm:text-base">
        {t("chat.buyerSubtitle")}
      </p>

      {!threadOpen && <ChatPushPrompt className="mx-3 mt-3 md:mx-0 md:mt-5" />}

      <ChatPanel
        role="buyer"
        onActiveChange={setThreadOpen}
        className="min-h-0 flex-1 rounded-none border-0 md:mt-5 md:h-[calc(100svh-20rem)] md:min-h-100 md:flex-none md:rounded-2xl md:border"
      />
    </div>
  );
}
