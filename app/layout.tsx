import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { FavoritesProvider } from "@/components/providers/favorites-provider";
import { CompareProvider } from "@/components/providers/compare-provider";
import { ChatStream } from "@/components/providers/chat-stream";
import { Metrika } from "@/components/providers/metrika";
import { AuthProvider } from "@/lib/api/auth";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL, SITE_DESCRIPTION, SITE_NAME, absoluteUrl } from "@/lib/seo";

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
    default: "neMalika — компьютерный рынок Малика в Ташкенте",
    template: "%s · neMalika",
  },
  description: SITE_DESCRIPTION,
  robots: {
    index: true,
    follow: true,
    googleBot: { "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "ru_RU",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: absoluteUrl("/social-image"), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/social-image")],
  },
  verification: {
    yandex: "f7605f24203c66e8",
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  appleWebApp: { capable: true, title: "neMalika", statusBarStyle: "default" },
};

// Цвет строки браузера совпадает с фоном страницы в текущей теме — иначе на
// телефоне сверху остаётся полоса от чужой темы.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#07090e" },
  ],
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
        <Metrika />
        <NextTopLoader color="var(--primary)" height={2} shadow={false} showSpinner={false} />
        <QueryProvider>
          <AuthProvider>
            <I18nProvider>
              <FavoritesProvider>
                <CompareProvider>
                  <TooltipProvider delayDuration={200}>
                    <ChatStream />
                    {children}
                    <Toaster position="top-center" richColors />
                  </TooltipProvider>
                </CompareProvider>
              </FavoritesProvider>
            </I18nProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
