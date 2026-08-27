"use client";

import dynamic from "next/dynamic";
import { TelegramIcon } from "@/components/icons/telegram-icon";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";

const LightRays = dynamic(() => import("@/components/magicui/light-rays"), {
  ssr: false,
});

export function AuthForm() {
  const { t } = useT();

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {t("auth.registerTitle")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("auth.registerSubtitle")}
          </p>

          <LoginDialog>
            <Button size="lg" className="mt-7 h-12 w-full gap-2 text-base">
              <TelegramIcon className="size-4" />
              {t("auth.telegramLogin")}
            </Button>
          </LoginDialog>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {t("auth.autoAccount")}
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            {t("auth.agree")}
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-[oklch(0.17_0.02_264)] lg:block">
        <LightRays
          raysOrigin="right"
          raysColor="#6f9bff"
          raysSpeed={0.8}
          rayLength={2.2}
          className="opacity-70"
        />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="self-start text-white" />
          <div className="max-w-md">
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight">
              {t("home.ctaTitle")}
            </h2>
            <p className="mt-3 text-white/65">{t("home.ctaText")}</p>
          </div>
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} {t("brand.name")}
          </p>
        </div>
      </div>
    </div>
  );
}
