import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/** Minimal shell for pixel-accurate Playwright captures (no site chrome). */
export default function MarketingScreenshotsExportLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-0 min-h-0 bg-black p-0" style={{ margin: 0 }}>
      {children}
    </div>
  );
}
