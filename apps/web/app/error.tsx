"use client";

import { sendAlert } from "@/lib/alerts";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);
  sendAlert(`App error boundary: ${error.message}`);
  return (
    <div className="mx-auto max-w-md p-8 font-sans text-sm">
      <h1 className="text-lg font-semibold">Something went wrong</h1>
      <p className="mt-2 text-muted-foreground">{error.message}</p>
      <button
        type="button"
        className="mt-4 rounded-md border border-border bg-background px-3 py-2 hover:bg-muted"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
