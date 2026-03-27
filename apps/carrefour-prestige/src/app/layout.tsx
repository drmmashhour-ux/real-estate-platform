import type { Metadata } from "next";
import { Inter, Libre_Baskerville } from "next/font/google";
import { PLATFORM_CARREFOUR_NAME, PLATFORM_NAME } from "@/lib/brand";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: `${PLATFORM_NAME} | ${PLATFORM_CARREFOUR_NAME}`,
  description:
    "Where Prestige Meets Opportunity — luxury real estate & investment technology platform.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${libre.variable}`}>
      <body className="min-h-screen bg-[#0B0B0B] font-sans text-[#CCCCCC] antialiased">{children}</body>
    </html>
  );
}
