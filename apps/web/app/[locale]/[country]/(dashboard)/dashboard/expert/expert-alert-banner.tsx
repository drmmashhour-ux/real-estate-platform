"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function ExpertAlertBanner() {
  const [n, setN] = useState<number | null>(null);

  useEffect(() => {
    void fetch("/api/mortgage/expert/alerts", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j && typeof j.newLeadCount === "number") setN(j.newLeadCount);
      })
      .catch(() => setN(0));
  }, []);

  if (n == null || n <= 0) return null;

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
      role="status"
    >
      <span className="font-semibold">New mortgage lead received — {n} unread</span>
      {" · "}
      <Link href="/dashboard/expert/leads" className="font-bold text-premium-gold underline">
        View leads
      </Link>
    </div>
  );
}
