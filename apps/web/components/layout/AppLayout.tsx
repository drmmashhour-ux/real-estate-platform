import type { ReactNode } from "react";

/** Root shell — black background, readable text, safe for dashboards + marketing. */
export function AppLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={["min-h-screen bg-ds-bg text-ds-text antialiased", className].join(" ")}>{children}</div>;
}
