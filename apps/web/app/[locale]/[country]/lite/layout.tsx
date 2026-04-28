import type { ReactNode } from "react";

/** Minimal Hadia lite shell — no heavy marketplace chrome overrides. */

export default function HadiaLiteLayout({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-lg px-4 py-6">{children}</section>;
}
