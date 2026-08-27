"use client";

import { Heart, History, Star, UserRound } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/components/providers/i18n-provider";
import { PageContainer } from "@/components/layout/page-container";
import { NotificationsCard } from "@/components/shared/notifications-card";
import { AccountProfile } from "./account-profile";
import { FavoritesList } from "./favorites-list";
import { MyReviews } from "./my-reviews";
import { ViewHistory } from "./view-history";

const tab = "px-2 text-xs sm:px-3.5 sm:text-sm";

export function AccountView({
  defaultTab = "history",
}: {
  defaultTab?: string;
}) {
  const { t } = useT();

  return (
    <PageContainer className="py-8">
      <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
        {t("account.title")}
      </h1>
      <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">
        {t("account.subtitle")}
      </p>

      <Tabs defaultValue={defaultTab} className="mt-6 gap-6">
        <TabsList className="w-full max-w-xl overflow-x-auto">
          <TabsTrigger value="history" className={tab}>
            <History />
            {t("account.tabs.history")}
          </TabsTrigger>
          <TabsTrigger value="favorites" className={tab}>
            <Heart />
            {t("account.tabs.favorites")}
          </TabsTrigger>
          <TabsTrigger value="reviews" className={tab}>
            <Star />
            {t("account.tabs.reviews")}
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
        <TabsContent value="reviews">
          <MyReviews />
        </TabsContent>
        <TabsContent value="profile" className="flex flex-col gap-4">
          <AccountProfile />
          <NotificationsCard />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
