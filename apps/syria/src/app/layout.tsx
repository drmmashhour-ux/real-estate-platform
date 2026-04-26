import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./globals.css";

// Hadiah Link is a separate product lane. Do not import layouts or tokens from other monorepo apps here.
// Favicon, Open Graph, and Twitter metadata are defined in `src/app/[locale]/layout.tsx`
// (`generateMetadata` + `darlinkMetadataBase()`), which wraps the real `<html>` document.

export const metadata: Metadata = {
  title: "Hadiah Link",
  description: "Find your next home — هدية لينك",
  icons: {
    icon: "/hadiah-favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
