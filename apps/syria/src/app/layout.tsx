import type { ReactNode } from "react";
import "./globals.css";

// Darlink is a separate product lane. Do not import LECIPM layout or tokens here.
// Favicon, Open Graph, and Twitter metadata are defined in `src/app/[locale]/layout.tsx`
// (`generateMetadata` + `darlinkMetadataBase()`), which wraps the real `<html>` document.

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
