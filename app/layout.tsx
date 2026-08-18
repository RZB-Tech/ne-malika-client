import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ChatStream } from "@/components/providers/chat-stream";
import { AuthProvider } from "@/lib/api/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL } from "@/lib/seo";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const THEME_INIT = `(function(){try{var d=localStorage.getItem('theme')==='dark';var e=document.documentElement;if(d)e.classList.add('dark');e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "neMalika — маркетплейс компьютерной техники",
    template: "%s · neMalika",
  },
  description:
    "Витрина компьютерной техники: комплектующие, готовые сборки и периферия от проверенных магазинов. Поиск, фильтры и связь с продавцом напрямую в Telegram.",
  verification: { yandex: "f7605f24203c66e8" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <NextTopLoader
          color="var(--primary)"
          height={2}
          shadow={false}
          showSpinner={false}
        />
        <QueryProvider>
          <AuthProvider>
            <I18nProvider>
              <TooltipProvider delayDuration={200}>
                <ChatStream />
                {children}
                <Toaster position="top-center" richColors />
              </TooltipProvider>
            </I18nProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
