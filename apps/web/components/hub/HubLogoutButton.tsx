"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";

/** Ends server session and returns user to the public homepage — paired with hub header for clear exit. */
export function HubLogoutButton() {
  const router = useRouter();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      title="Sign out — ends your session in this browser. You can sign in again anytime."
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
          showToast("You're signed out. Your session on this device has ended.", "success");
          router.push("/");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/85 transition hover:border-premium-gold/45 hover:text-white disabled:opacity-50"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
