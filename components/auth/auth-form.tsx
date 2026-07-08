"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/shared/logo";
import { LoginDialog } from "@/components/auth/login-dialog";
import { useT } from "@/components/providers/i18n-provider";

const LightRays = dynamic(() => import("@/components/magicui/light-rays"), {
  ssr: false,
});

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useT();
  const router = useRouter();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/seller");
  };

  const isLogin = mode === "login";

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* form */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">
            {t(isLogin ? "auth.loginTitle" : "auth.registerTitle")}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t(isLogin ? "auth.loginSubtitle" : "auth.registerSubtitle")}
          </p>

          <Button variant="outline" className="mt-7 w-full gap-2" onClick={() => router.push("/seller")}>
            <Send className="size-4 text-primary" />
            {t("auth.telegramLogin")}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            {t("auth.orEmail")}
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name">{t("auth.name")}</Label>
                  <Input id="name" placeholder="Иван" autoComplete="name" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="store">{t("auth.storeName")}</Label>
                  <Input id="store" placeholder="TechnoDom Store" />
                </div>
              </>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" placeholder="••••••••" autoComplete={isLogin ? "current-password" : "new-password"} />
            </div>

            <Button type="submit" className="w-full">
              {t(isLogin ? "auth.loginButton" : "auth.registerButton")}
            </Button>
          </form>

          {!isLogin && (
            <p className="mt-4 text-center text-xs text-muted-foreground">{t("auth.agree")}</p>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? (
              <>
                {t("auth.noAccount")}{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  {t("nav.register")}
                </Link>
              </>
            ) : (
              <>
                {t("auth.haveAccount")}{" "}
                <LoginDialog>
                  <button className="font-medium text-primary hover:underline">
                    {t("nav.login")}
                  </button>
                </LoginDialog>
              </>
            )}
          </p>
        </div>
      </div>

      {/* visual */}
      <div className="relative hidden overflow-hidden bg-[oklch(0.17_0.02_264)] lg:block">
        <LightRays raysOrigin="right" raysColor="#6f9bff" raysSpeed={0.8} rayLength={2.2} className="opacity-70" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo />
          <div className="max-w-md">
            <h2 className="font-heading text-3xl font-bold leading-tight tracking-tight">
              {t("home.ctaTitle")}
            </h2>
            <p className="mt-3 text-white/65">{t("home.ctaText")}</p>
          </div>
          <p className="text-xs text-white/45">© {new Date().getFullYear()} {t("brand.name")}</p>
        </div>
      </div>
    </div>
  );
}
