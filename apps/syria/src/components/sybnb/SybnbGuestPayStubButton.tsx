"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  bookingId: string;
};

/**
 * Guest-only: requests stub payment intent (no real Stripe). Idempotency key is generated once per mount.
 */
export function SybnbGuestPayStubButton({ bookingId }: Props) {
  const t = useTranslations("Dashboard");
  const idempotencyKey = useId().replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50/80 p-3 text-sm">
      <p className="font-medium text-stone-800">{t("sybnbPayStubTitle")}</p>
      <p className="mt-1 text-xs text-stone-600">{t("sybnbPayStubHint")}</p>
      <button
        type="button"
        disabled={loading}
        className="mt-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        onClick={async () => {
          setMsg(null);
          setLoading(true);
          try {
            const res = await fetch("/api/sybnb/payment-intent", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ bookingId, idempotencyKey }),
            });
            const j = (await res.json()) as { paymentIntentId?: string; error?: string; message?: string };
            if (!res.ok) {
              setMsg(t("sybnbPayStubError"));
            } else {
              setMsg(t("sybnbPayStubOk", { id: j.paymentIntentId ?? "—" }));
            }
          } catch {
            setMsg(t("sybnbPayStubError"));
          } finally {
            setLoading(false);
          }
        }}
      >
        {loading ? t("sybnbPayStubLoading") : t("sybnbPayStubCta")}
      </button>
      {msg ? <p className="mt-2 text-xs text-stone-700">{msg}</p> : null}
    </div>
  );
}
