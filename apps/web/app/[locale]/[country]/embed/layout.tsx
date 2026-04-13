import type { ReactNode } from "react";

/** Route group for iframe-friendly pages (inherits root `app/layout.tsx`). */
export default function EmbedLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-950 antialiased">{children}</div>;
}
