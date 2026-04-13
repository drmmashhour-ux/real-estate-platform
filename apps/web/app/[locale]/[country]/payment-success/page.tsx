"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PaymentSuccessInsuranceBlock } from "@/components/insurance/PaymentSuccessInsuranceBlock";

const DEFAULT_SCHEME = "lecipm";

function mobileDeepLinkScheme() {
  const raw =
    process.env.NEXT_PUBLIC_MOBILE_DEEP_LINK_SCHEME ||
    process.env.NEXT_PUBLIC_MOBILE_APP_SCHEME ||
    DEFAULT_SCHEME;
  return raw.replace(/:\/?\/?$/, "");
}

function PaymentSuccessInner() {
  const sp = useSearchParams();
  const bookingId = sp.get("bookingId") ?? "";
  const sessionId = sp.get("session_id") ?? "";
  const scheme = mobileDeepLinkScheme();

  const deepLink = useMemo(() => {
    const q = new URLSearchParams();
    if (bookingId) q.set("bookingId", bookingId);
    if (sessionId) q.set("session_id", sessionId);
    const qs = q.toString();
    return qs ? `${scheme}://payment-success?${qs}` : `${scheme}://payment-success`;
  }, [bookingId, sessionId, scheme]);

  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    if (!bookingId || attempted) return;
    // Brief pause so guests can opt into insurance before the app deep link fires.
    const t = window.setTimeout(() => {
      setAttempted(true);
      window.location.href = deepLink;
    }, 4500);
    return () => window.clearTimeout(t);
  }, [bookingId, deepLink, attempted]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0b0b0b",
        color: "#fff",
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: "1rem",
      }}
    >
      <h1 style={{ color: "#d4af37", fontSize: "1.5rem", margin: 0 }}>Payment successful</h1>
      <PaymentSuccessInsuranceBlock />
      <p style={{ color: "#a6a6a6", maxWidth: 420, lineHeight: 1.5 }}>
        {bookingId
          ? "Opening the BNHUB app in a few seconds. If it does not open, use Return to app below."
          : "We tried to open the BNHUB app automatically. If the app did not open, stay on this page and use Return to app below."}
      </p>
      {bookingId ? (
        <p style={{ color: "#e5e5e5", fontSize: "0.95rem" }}>
          Booking ID: <span style={{ color: "#d4af37" }}>{bookingId}</span>
        </p>
      ) : null}
      <a
        href={deepLink}
        style={{
          display: "inline-block",
          marginTop: "0.5rem",
          padding: "14px 24px",
          borderRadius: 12,
          background: "#d4af37",
          color: "#0a0a0a",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Return to app
      </a>
      <p style={{ color: "#666", fontSize: "0.85rem", maxWidth: 420, marginTop: "0.5rem" }}>
        Scheme: <code style={{ color: "#a6a6a6" }}>{scheme}</code> — set{" "}
        <code style={{ color: "#a6a6a6" }}>NEXT_PUBLIC_MOBILE_DEEP_LINK_SCHEME</code> to match your Expo app.
      </p>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", background: "#0b0b0b", color: "#d4af37", padding: 24 }}>Loading…</main>
      }
    >
      <PaymentSuccessInner />
    </Suspense>
  );
}
