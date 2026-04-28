"use client";

import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

type Props = {
  bookingId: string;
};

/**
 * Guest-only — ORDER SYBNB-110: opens Stripe Checkout (`checkout.session`) when gates pass.
 */
export function SybnbGuestPayStubButton({ bookingId }: Props) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
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
        data-demo-record="sybnb_guest_pay_checkout"
        className="mt-2 rounded-lg bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        onClick={async () => {
          setMsg(null);
          setLoading(true);
          try {
            const res = await fetch("/api/sybnb/checkout-session", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ bookingId, idempotencyKey, locale }),
            });
            const j = (await res.json()) as Record<string, unknown>;
            if (!res.ok) {
              const detail =
                typeof j.detail === "string"
                  ? j.detail
                  : typeof j.reason === "string"
                    ? j.reason
                    : typeof j.error === "string"
                      ? j.error
                      : t("sybnbPayStubError");
              setMsg(detail);
              return;
            }
            const url = typeof j.url === "string" ? j.url : "";
            if (url.startsWith("http")) {
              window.location.assign(url);
              return;
            }
            setMsg(t("sybnbPayStubError"));
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
