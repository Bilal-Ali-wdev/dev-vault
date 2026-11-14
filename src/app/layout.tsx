import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", weight: ["400", "500", "600"] });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", weight: ["500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: { default: "DevVault — every project you build, remembered and secured", template: "%s · DevVault" },
  description: "Track tasks and work sessions, keep env secrets in an encrypted vault, connect GitHub and ask AI where you left off.",
};

export const viewport: Viewport = { themeColor: "#077264" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} ${jakarta.variable}`}>
      <body>{children}</body>
    </html>
  );
}
