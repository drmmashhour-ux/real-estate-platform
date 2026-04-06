"use client";

import { useEffect, useRef } from "react";
import { VIRAL_REF_COOKIE, VIRAL_REF_COOKIE_MAX_AGE } from "@/lib/referrals/viral";

type Props = {
  /** Raw `?ref=` (user id or referral code) — stored for signup. */
  rawRef: string | null;
  /** Resolved public referral code for analytics (optional). */
  attributionCode: string | null;
};

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

export function ViralInviteLanding({ rawRef, attributionCode }: Props) {
  const tracked = useRef(false);

  useEffect(() => {
    if (!rawRef?.trim()) return;
    setCookie(VIRAL_REF_COOKIE, rawRef.trim(), VIRAL_REF_COOKIE_MAX_AGE);
    if (tracked.current) return;
    tracked.current = true;
    const code = attributionCode?.trim().toUpperCase();
    if (!code) return;
    void fetch("/api/referrals/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, eventType: "invite_sent" }),
    }).catch(() => {});
  }, [rawRef, attributionCode]);

  return null;
}
