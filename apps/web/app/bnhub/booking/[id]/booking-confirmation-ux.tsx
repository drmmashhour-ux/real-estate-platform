"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/** Poll after Stripe return (?paid=1) until webhook confirms payment. */
export function PostPaymentPoll({
  bookingId,
  enabled,
}: {
  bookingId: string;
  enabled: boolean;
}) {
  const router = useRouter();
  useEffect(() => {
    if (!enabled) return;
    const started = Date.now();
    const maxMs = 90_000;
    const t = setInterval(async () => {
      if (Date.now() - started > maxMs) {
        clearInterval(t);
        return;
      }
      try {
        const res = await fetch(`/api/bnhub/bookings/${bookingId}/status`);
        const data = (await res.json()) as { paymentStatus?: string; bookingStatus?: string };
        if (data.paymentStatus === "COMPLETED" && (data.bookingStatus === "CONFIRMED" || data.bookingStatus === "COMPLETED")) {
          clearInterval(t);
          router.refresh();
          if (typeof window !== "undefined") {
            const u = new URL(window.location.href);
            u.searchParams.delete("paid");
            window.history.replaceState({}, "", u.pathname + u.search);
          }
        }
      } catch {
        /* ignore */
      }
    }, 3000);
    return () => clearInterval(t);
  }, [bookingId, enabled, router]);
  return null;
}

export function CopyCodeButton({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      /* ignore */
    }
  }, [code]);
  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      className="mt-3 rounded-lg border border-amber-400/50 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-200 hover:bg-amber-500/20"
    >
      {done ? "Copied!" : "Copy code"}
    </button>
  );
}
