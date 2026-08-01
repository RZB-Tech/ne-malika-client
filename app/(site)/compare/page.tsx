import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";

// Список сравнения у каждого свой и живёт в браузере — индексировать нечего.
export const metadata: Metadata = {
  title: "Сравнение товаров",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return <CompareView />;
}
