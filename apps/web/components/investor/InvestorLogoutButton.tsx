"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvestorLogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
          router.push("/investor/login");
          router.refresh();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:text-slate-300 disabled:opacity-50"
    >
      {busy ? "…" : "Sign out"}
    </button>
  );
}
