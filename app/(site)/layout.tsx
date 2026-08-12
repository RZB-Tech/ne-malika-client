import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CompareBar } from "@/components/compare/compare-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-14 md:pb-0">{children}</main>
      <CompareBar />
      <SiteFooter />
      <BottomNav />
    </>
  );
}
