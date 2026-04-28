"use client";

import { sendAlert } from "@/lib/alerts";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * Root error boundary (renders inside root layout) — black + gold shell.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (typeof window !== "undefined") {
    console.error(error);
    void sendAlert(`App error boundary: ${error.message}`);
  }

  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[#0b0b0b] px-4 py-16">
      <Container narrow className="text-center">
        <div className="rounded-[var(--ds-radius-xl)] border border-white/10 bg-[#121212] p-8 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Something went wrong</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold text-white sm:text-3xl">We couldn&apos;t load this view</h2>
          <p className="mt-3 text-sm text-premium-text-muted">{error.message}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button type="button" variant="goldPrimary" onClick={() => reset()}>
              Try again
            </Button>
          </div>
        </div>
      </Container>
    </div>
  );
}
