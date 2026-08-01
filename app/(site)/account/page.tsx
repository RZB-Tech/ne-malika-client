import type { Metadata } from "next";
import { AccountView } from "@/components/account/account-view";

// Личная страница: индексировать нечего, содержимое у каждого своё.
export const metadata: Metadata = {
  title: "Личный кабинет",
  robots: { index: false, follow: true },
};

export default function AccountPage() {
  return <AccountView />;
}
