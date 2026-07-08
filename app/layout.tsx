import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { I18nProvider } from "@/components/providers/i18n-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

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

export const metadata: Metadata = {
  title: {
    default: "Ядро — маркетплейс компьютерной техники",
    template: "%s · Ядро",
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
      </head>
      <body className="flex min-h-full flex-col">
        <I18nProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="top-center" richColors />
          </TooltipProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
