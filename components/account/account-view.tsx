"use client";

import { Heart, History, UserRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/components/providers/i18n-provider";
import { AccountProfile } from "./account-profile";
import { FavoritesList } from "./favorites-list";
import { ViewHistory } from "./view-history";

/**
 * Кабинет покупателя. Живёт внутри витрины (шапка + подвал), а не в
 * DashboardShell: покупателю нужны несколько вкладок, ради них боковое меню
 * продавца было бы лишним.
 *
 * Вход не обязателен — история и избранное копятся и у анонима, поэтому
 * страница открыта всем, а вкладка «Профиль» у гостя предлагает войти.
 */
const tab = "px-2 text-xs sm:px-3.5 sm:text-sm";

export function AccountView({
  defaultTab = "history",
}: {
  defaultTab?: string;
}) {
  const { t } = useT();

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-8 lg:px-10">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {t("account.title")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
        {t("account.subtitle")}
      </p>

      <Tabs defaultValue={defaultTab} className="mt-6 gap-6">
        {/* Во всю ширину: три вкладки делят её поровну и помещаются на телефоне.
            overflow-x-auto — страховка на случай длинных переводов. */}
        <TabsList className="w-full max-w-md overflow-x-auto">
          {/* Отступы по умолчанию (px-3.5) на телефоне съедают лишние ~35px,
              и третья вкладка уезжает за край. */}
          <TabsTrigger value="history" className={tab}>
            <History />
            {t("account.tabs.history")}
          </TabsTrigger>
          <TabsTrigger value="favorites" className={tab}>
            <Heart />
            {t("account.tabs.favorites")}
          </TabsTrigger>
          <TabsTrigger value="profile" className={tab}>
            <UserRound />
            {t("account.tabs.profile")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history">
          <ViewHistory />
        </TabsContent>
        <TabsContent value="favorites">
          <FavoritesList />
        </TabsContent>
        <TabsContent value="profile">
          <AccountProfile />
        </TabsContent>
      </Tabs>
    </div>
  );
}
