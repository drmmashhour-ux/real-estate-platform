import type { ReactNode } from "react";

/** Standalone conversion shell — full-bleed black; no dashboard chrome. */
export default function GetLeadsLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-black antialiased">{children}</div>;
}
