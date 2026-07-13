import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { AuthProvider } from "@/lib/api/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { METRIKA_COUNTER_ID } from "@/lib/metrika";
import { MetrikaPageview } from "@/components/analytics/metrika-pageview";

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

// Runs before paint (in <head>) to apply the persisted theme without a flash.
// The theme is a plain `.dark` class + `color-scheme`, toggled client-side by
// AnimatedThemeToggler and persisted under the "theme" key. Rendered by this
// Server Component, so it never trips React's client-side <script> warning.
const THEME_INIT = `(function(){try{var d=localStorage.getItem('theme')==='dark';var e=document.documentElement;if(d)e.classList.add('dark');e.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

const YANDEX_METRIKA_ID = METRIKA_COUNTER_ID;

const YANDEX_METRIKA = `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}','ym');ym(${YANDEX_METRIKA_ID},'init',{ssr:true,webvisor:true,clickmap:true,ecommerce:"dataLayer",referrer:document.referrer,url:location.href,accurateTrackBounce:true,trackLinks:true});`;

export const metadata: Metadata = {
  title: { 
    default: "neMalika — маркетплейс компьютерной техники",
    template: "%s · neMalika",
  },
  description:
    "Витрина компьютерной техники: комплектующие, готовые сборки и периферия от проверенных магазинов. Поиск, фильтры и связь с продавцом напрямую в Telegram.",
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
      className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        {/* Telegram Mini App SDK — exposes window.Telegram.WebApp (with initData)
            inside the Telegram client on both mobile and Telegram Desktop. */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        <script dangerouslySetInnerHTML={{ __html: YANDEX_METRIKA }} />
      </head>
      {/* Extensions (asbplayer & co.) inject classes/attrs on <body> before
          hydration — suppress the resulting attribute mismatch. */}
      <body suppressHydrationWarning className="flex min-h-full flex-col">
        <noscript>
          <div>
            <img
              src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
              style={{ position: "absolute", left: "-9999px" }}
              alt=""
            />
          </div>
        </noscript>
        <MetrikaPageview />
        <QueryProvider>
          <AuthProvider>
            <I18nProvider>
              <TooltipProvider delayDuration={200}>
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
