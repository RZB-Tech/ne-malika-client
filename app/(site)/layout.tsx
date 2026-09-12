import { SiteHeader } from "@/components/layout/site-header";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { CompareBar } from "@/components/compare/compare-bar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SiteAssistant } from "@/components/assistant/site-assistant";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <CompareBar />
      <SiteFooter />
      <Suspense>
        <BottomNav />
      </Suspense>
      <SiteAssistant />
    </>
  );
}
