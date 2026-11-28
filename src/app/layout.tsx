import type { Metadata, Viewport } from "next";
import { Funnel_Display, Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const funnel = Funnel_Display({ variable: "--font-funnel", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Reeload",
  description: "Reel-shoot operations: sales, scheduling, check-in, uploads and payments.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Reeload", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#df3b2b", width: "device-width", initialScale: 1 };

/**
 * HeroUI picks its palette from a "light"/"dark" class on <html>, while our own colours follow the OS
 * (color-scheme: light dark). This runs before the first paint and keeps both on the OS setting.
 */
const THEME_SCRIPT = `(function(){var m=window.matchMedia("(prefers-color-scheme: dark)");function s(){var d=m.matches,h=document.documentElement;h.classList.toggle("dark",d);h.classList.toggle("light",!d);h.dataset.theme=d?"dark":"light";}s();m.addEventListener("change",s);})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className={`${geist.variable} ${geistMono.variable} ${funnel.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
