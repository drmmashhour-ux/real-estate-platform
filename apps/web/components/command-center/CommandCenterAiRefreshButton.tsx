"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CommandCenterAiRefreshButton(props: { className?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setPending(true);
    setMessage(null);
    try {
      const res = await fetch("/api/command-center/refresh", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(typeof data.error === "string" ? data.error : `Failed (${res.status})`);
        return;
      }
      setMessage(data.snapshot?.id ? "Snapshot saved for learning & audit." : "Refreshed.");
      router.refresh();
    } catch {
      setMessage("Network error");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => void refresh()}
        disabled={pending}
        className={
          props.className ??
          "rounded-lg border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-2 text-sm font-medium text-[#f4efe4] disabled:opacity-50"
        }
      >
        {pending ? "Saving snapshot…" : "Persist snapshot (audit + learning)"}
      </button>
      {message ? <p className="text-xs text-neutral-500">{message}</p> : null}
    </div>
  );
}
