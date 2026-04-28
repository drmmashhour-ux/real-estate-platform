"use client";

import { sendAlert } from "@/lib/alerts";

/**
 * Replaces root layout when the root shell fails — must define html/body.
 * @see https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[global-error]", error);
  void sendAlert(`Fatal app error: ${error.message ?? "unknown"}`);

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b0b0b] text-white antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-6 px-6 py-20 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">Application error</p>
          <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
            Something broke at the shell level
          </h1>
          <p className="text-sm text-premium-text-muted">{error.message}</p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl bg-premium-gold px-8 py-3 font-semibold text-[#0b0b0b] shadow-lg shadow-premium-gold/20 hover:bg-premium-gold-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-premium-gold"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
