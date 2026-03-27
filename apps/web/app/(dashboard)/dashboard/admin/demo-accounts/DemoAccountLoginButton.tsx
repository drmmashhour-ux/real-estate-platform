"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getDefaultHub } from "@/lib/hub/router";

type Props = {
  email: string;
  enabled: boolean;
};

export function DemoAccountLoginButton({ email, enabled }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; role?: string };
      if (!res.ok || !j.ok) {
        window.alert(j.error ?? "Demo login failed");
        return;
      }
      router.push(getDefaultHub({ role: j.role ?? "USER" }));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={!enabled || loading}
      onClick={() => void onLogin()}
      className="rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black disabled:cursor-not-allowed disabled:opacity-40"
    >
      {loading ? "…" : "Login"}
    </button>
  );
}
