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
      {/* Отступ снизу на телефоне — под нижнюю панель навигации: без него она
          накрывает последнюю строку каталога и кнопки подвала. */}
      <main className="flex-1 pb-14 lg:pb-0">{children}</main>
      {/* Между контентом и подвалом: панель липнет к низу окна, пока в списке
          сравнения что-то есть, и едет за пользователем по всей витрине. */}
      <CompareBar />
      <SiteFooter />
      <BottomNav />
    </>
  );
}
