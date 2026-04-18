import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

/** Vertical marketing column — hero + sections; does not replace route `app/(marketing)/layout`. */
export function MarketingLayout({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={["flex min-h-screen flex-col bg-ds-bg text-ds-text", className].join(" ")}>
      <Container className="flex-1 py-8 md:py-12">{children}</Container>
    </div>
  );
}
