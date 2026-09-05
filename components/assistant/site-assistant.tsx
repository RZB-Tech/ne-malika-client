"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Bot, Loader2, RotateCcw, Send, Sparkles, X } from "@/components/icons";
import { useT } from "@/components/providers/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InputGroup, InputGroupAddon, InputGroupTextarea } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { ProductImage } from "@/components/shared/product-image";
import { useCompare } from "@/lib/compare/use-compare";
import { hueFromId } from "@/lib/api/mappers";
import { photoUrl } from "@/lib/api/photo";
import { priceText } from "@/lib/format";
import { ASSISTANT_SEEN_KEY, MESSAGE_MAX } from "@/lib/assistant/conversation";
import { cn } from "@/lib/utils";
import { useAssistant } from "./use-assistant";

export function SiteAssistant() {
  const { locale } = useT();
  return <AssistantSession key={locale} />;
}

function AssistantSession() {
  const { t, locale } = useT();
  const pathname = usePathname();
  const { items } = useCompare();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const { messages, pending, failed, send, reset } = useAssistant(locale, pathname);
  const bottom = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const opened = useRef(false);
  const compareVisible = items.length > 0 && pathname !== "/compare" && pathname !== "/messages";

  function changeOpen(value: boolean) {
    opened.current = true;
    setOpen(value);
    try {
      localStorage.setItem(ASSISTANT_SEEN_KEY, "1");
    } catch {
      /* Optional browser storage. */
    }
  }

  useEffect(() => {
    try {
      if (localStorage.getItem(ASSISTANT_SEEN_KEY)) return;
    } catch {
      /* Show once this mount. */
    }
    const timer = window.setTimeout(() => {
      // Do not interrupt a login, catalog dialog, or another focused task.
      if (
        opened.current ||
        document.querySelector('[role="dialog"], [role="alertdialog"]') ||
        document.activeElement?.matches("input, textarea, [contenteditable=true]")
      )
        return;
      opened.current = true;
      setOpen(true);
      try {
        localStorage.setItem(ASSISTANT_SEEN_KEY, "1");
      } catch {
        /* Optional browser storage. */
      }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => bottom.current?.scrollIntoView({ block: "nearest" }), 0);
    return () => window.clearTimeout(timer);
  }, [open, messages.length, pending, failed]);

  function submit(value = draft) {
    if (!value.trim() || pending) return;
    setDraft("");
    void send(value);
  }

  const suggestions = messages.at(-1)?.reply?.suggestions ?? [];

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button
          ref={trigger}
          size="lg"
          aria-label={t("assistant.open")}
          title={t("assistant.open")}
          className={cn(
            "fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 h-12 rounded-full shadow-lg md:right-6 md:bottom-6",
            compareVisible && "bottom-[calc(10rem+env(safe-area-inset-bottom))] md:bottom-28",
          )}
        >
          <Bot data-icon="inline-start" />
          <span className="hidden sm:inline">{t("assistant.launcher")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="inset-x-0 top-auto bottom-0 flex h-[min(44rem,90dvh)] max-h-[90dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-b-none p-0 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto sm:h-[min(42rem,calc(100dvh-3rem))] sm:max-h-[calc(100dvh-3rem)] sm:max-w-[26rem] sm:rounded-b-xl"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          heading.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          trigger.current?.focus({ preventScroll: true });
        }}
      >
        <header className="flex shrink-0 items-center gap-3 p-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Bot className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle ref={heading} tabIndex={-1} className="outline-none">
              {t("assistant.title")}
            </DialogTitle>
            <DialogDescription className="mt-1">{t("assistant.subtitle")}</DialogDescription>
          </div>
          {(messages.length > 0 || pending || failed) && (
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("assistant.reset")}
              title={t("assistant.reset")}
              onClick={() => {
                reset();
                setDraft("");
              }}
            >
              <RotateCcw />
            </Button>
          )}
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("assistant.close")}
              title={t("assistant.close")}
            >
              <X />
            </Button>
          </DialogClose>
        </header>
        <Separator />
        <ScrollArea className="min-h-0 flex-1" aria-label={t("assistant.conversation")}>
          <div
            role="log"
            aria-live="polite"
            aria-relevant="additions"
            className="flex min-w-0 flex-col gap-4 p-4"
          >
            <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
              <Sparkles className="size-5 text-primary" />
              <p className="font-medium">{t("assistant.welcome")}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("assistant.intro")}
              </p>
            </div>
            {messages.length === 0 && !pending && !failed && (
              <div className="flex flex-col gap-2">
                {["choose", "build", "explore"].map((key) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="h-auto justify-between gap-3 whitespace-normal py-3 text-left"
                    onClick={() => submit(t(`assistant.starters.${key}`))}
                  >
                    {t(`assistant.starters.${key}`)}
                    <ArrowUpRight data-icon="inline-end" />
                  </Button>
                ))}
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex min-w-0 flex-col gap-2",
                  message.role === "user" && "items-end",
                )}
              >
                <p className="sr-only">
                  {t(message.role === "user" ? "assistant.you" : "assistant.title")}
                </p>
                <p
                  className={cn(
                    "max-w-full rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]",
                    message.role === "user"
                      ? "max-w-[90%] rounded-br-md bg-primary text-primary-foreground"
                      : "rounded-bl-md bg-muted/60",
                  )}
                >
                  {message.content}
                </p>
                {message.reply?.products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    onClick={() => changeOpen(false)}
                    className="flex min-w-0 items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <ProductImage
                      hue={hueFromId(product.id)}
                      categorySlug=""
                      src={photoUrl(product.photo)}
                      alt=""
                      fit="contain"
                      className="size-14 shrink-0 rounded-lg"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium [overflow-wrap:anywhere]">
                        {product.name}
                      </p>
                      <p className="mt-1 text-sm font-semibold">
                        {priceText(product.price, locale, t)}
                      </p>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {product.shopName} ·{" "}
                        {t(product.state === "new" ? "product.stateNew" : "product.stateOld")}
                      </p>
                    </div>
                    <ArrowUpRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
                {!!message.reply?.links.length && (
                  <div className="flex flex-wrap gap-2">
                    {message.reply.links.map((link) => (
                      <Button key={link.href} asChild variant="outline" size="sm">
                        <Link href={link.href} onClick={() => changeOpen(false)}>
                          {link.label}
                          <ArrowUpRight data-icon="inline-end" />
                        </Link>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(pending || failed) && (
              <p className="ml-auto max-w-[90%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground whitespace-pre-wrap [overflow-wrap:anywhere]">
                {pending ?? failed?.text}
              </p>
            )}
            {pending && (
              <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 motion-safe:animate-spin" />
                {t("assistant.thinking")}
              </p>
            )}
            {failed && (
              <div role="alert" className="flex flex-col items-start gap-2">
                <p className="text-sm text-destructive">
                  {t(
                    failed.status === 429
                      ? "assistant.rateLimit"
                      : failed.status === 503
                        ? "assistant.unavailable"
                        : "assistant.error",
                  )}
                </p>
                <Button variant="outline" size="sm" onClick={() => submit(failed.text)}>
                  <RotateCcw data-icon="inline-start" />
                  {t("assistant.retry")}
                </Button>
              </div>
            )}
            {!pending && !failed && suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    className="h-auto max-w-full whitespace-normal py-2 text-left"
                    onClick={() => submit(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            )}
            <div ref={bottom} />
          </div>
        </ScrollArea>
        <form
          className="flex shrink-0 flex-col gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="assistant-message" className="sr-only">
                {t("assistant.inputLabel")}
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="assistant-message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={MESSAGE_MAX}
                  rows={1}
                  placeholder={t("assistant.placeholder")}
                  className="max-h-36"
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey &&
                      !event.nativeEvent.isComposing &&
                      window.matchMedia("(pointer: fine)").matches
                    ) {
                      event.preventDefault();
                      submit();
                    }
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <Button
                    type="submit"
                    size="icon"
                    className="size-11 rounded-full"
                    disabled={!!pending || !draft.trim()}
                    aria-label={t("assistant.send")}
                    title={t("assistant.send")}
                  >
                    {pending ? <Loader2 className="motion-safe:animate-spin" /> : <Send />}
                  </Button>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
          <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
            {t("assistant.note")}
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
