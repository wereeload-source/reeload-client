import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// The mockup's three typefaces: Inter for text, Space Grotesk for headings, JetBrains Mono for times, codes and money.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const grotesk = Space_Grotesk({ variable: "--font-grotesk", subsets: ["latin"], weight: ["500", "600", "700"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "Reeload",
  description: "Reel-shoot operations: sales, scheduling, check-in, uploads and payments.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/logo.svg" },
  appleWebApp: { capable: true, title: "Reeload", statusBarStyle: "black" },
};

export const viewport: Viewport = { themeColor: "#0e1116", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN" className="light" data-theme="light">
      <body className={`${inter.variable} ${grotesk.variable} ${jetbrains.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
