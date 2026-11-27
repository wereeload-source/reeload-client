import type { Metadata, Viewport } from "next";
import { Funnel_Display, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const funnel = Funnel_Display({ variable: "--font-funnel", subsets: ["latin"], weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "ReelOps",
  description: "Reel-shoot operations: sales, scheduling, check-in, uploads and payments.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "ReelOps", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#df3b2b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body className={`${geist.variable} ${geistMono.variable} ${funnel.variable} antialiased`}>{children}</body>
    </html>
  );
}
