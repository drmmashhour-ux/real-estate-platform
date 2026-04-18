import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";

type Props = {
  topBar?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
  /** Optional right column — AI insights, filters */
  aside?: ReactNode;
  className?: string;
};

/**
 * Standard dashboard grid: optional sidebar + main + optional insights column.
 */
export function DashboardLayout({ topBar, sidebar, children, aside, className = "" }: Props) {
  return (
    <div className={["flex min-h-screen flex-col bg-ds-bg text-ds-text", className].join(" ")}>
      {topBar}
      <div className="flex min-h-0 flex-1">
        {sidebar ? (
          <aside className="hidden w-60 shrink-0 border-r border-ds-border bg-ds-surface lg:block">{sidebar}</aside>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col">
          <Container className="flex-1 py-6 md:py-8">
            {aside ?
              <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div className="min-w-0">{children}</div>
                <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">{aside}</aside>
              </div>
            : children}
          </Container>
        </div>
      </div>
    </div>
  );
}
