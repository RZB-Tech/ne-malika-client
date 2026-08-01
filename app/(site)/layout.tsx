import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CompareBar } from "@/components/compare/compare-bar";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      {/* Между контентом и подвалом: панель липнет к низу окна, пока в списке
          сравнения что-то есть, и едет за пользователем по всей витрине. */}
      <CompareBar />
      <SiteFooter />
    </>
  );
}
