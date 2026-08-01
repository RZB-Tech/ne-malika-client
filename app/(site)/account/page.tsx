import type { Metadata } from "next";
import { AccountView } from "@/components/account/account-view";

// Личная страница: индексировать нечего, содержимое у каждого своё.
export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: true },
};

const TABS = ["history", "favorites", "profile"];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  // ?tab= нужен ссылкам из шапки: сердце должно открывать сразу избранное.
  const { tab } = await searchParams;

  return (
    <AccountView defaultTab={tab && TABS.includes(tab) ? tab : "history"} />
  );
}
