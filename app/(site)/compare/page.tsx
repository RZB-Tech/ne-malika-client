import type { Metadata } from "next";
import { CompareView } from "@/components/compare/compare-view";

export const metadata: Metadata = {
  title: "Сравнение товаров",
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return <CompareView />;
}
