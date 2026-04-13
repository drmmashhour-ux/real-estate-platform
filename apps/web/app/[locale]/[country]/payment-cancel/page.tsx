"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_SCHEME = "lecipm";

function mobileDeepLinkScheme() {
  const raw =
    process.env.NEXT_PUBLIC_MOBILE_DEEP_LINK_SCHEME ||
    process.env.NEXT_PUBLIC_MOBILE_APP_SCHEME ||
    DEFAULT_SCHEME;
  return raw.replace(/:\/?\/?$/, "");
}

function PaymentCancelInner() {
  const sp = useSearchParams();
  const bookingId = sp.get("bookingId") ?? "";
  const scheme = mobileDeepLinkScheme();

  const deepLink = useMemo(() => {
    if (!bookingId.trim()) return `${scheme}://payment-cancel`;
    const q = new URLSearchParams();
    q.set("bookingId", bookingId);
    return `${scheme}://payment-cancel?${q.toString()}`;
  }, [bookingId, scheme]);

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
      <h1 style={{ color: "#d4af37", fontSize: "1.5rem", margin: 0 }}>Payment cancelled</h1>
      <p style={{ color: "#a6a6a6", maxWidth: 420, lineHeight: 1.5 }}>
        No charge was completed. Return to the app to retry payment for the same booking or change your dates.
      </p>
      {bookingId ? (
        <p style={{ color: "#e5e5e5", fontSize: "0.95rem" }}>
          Booking ID: <span style={{ color: "#d4af37" }}>{bookingId}</span>
        </p>
      ) : (
        <p style={{ color: "#888", fontSize: "0.9rem", maxWidth: 420 }}>
          No booking id in this link — open the app from your device and continue from <strong style={{ color: "#c4c4c4" }}>Payment</strong> or{" "}
          <strong style={{ color: "#c4c4c4" }}>Booking status</strong>.
        </p>
      )}
      <a
        href={deepLink}
        style={{
          display: "inline-block",
          marginTop: "0.5rem",
          padding: "14px 24px",
          borderRadius: 12,
          border: "1px solid #d4af37",
          color: "#d4af37",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Return to app
      </a>
      <p style={{ color: "#666", fontSize: "0.85rem", maxWidth: 420, marginTop: "0.5rem" }}>
        Scheme: <code style={{ color: "#a6a6a6" }}>{scheme}</code> — set{" "}
        <code style={{ color: "#a6a6a6" }}>NEXT_PUBLIC_MOBILE_DEEP_LINK_SCHEME</code> (or{" "}
        <code style={{ color: "#a6a6a6" }}>NEXT_PUBLIC_MOBILE_APP_SCHEME</code>) to match your Expo app.
      </p>
    </main>
  );
}

export default function PaymentCancelPage() {
  return (
    <Suspense
      fallback={
        <main style={{ minHeight: "100vh", background: "#0b0b0b", color: "#d4af37", padding: 24 }}>Loading…</main>
      }
    >
      <PaymentCancelInner />
    </Suspense>
  );
}
