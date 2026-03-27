"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DemoEvents } from "@/lib/demo-event-types";
import { isPublicDemoMode } from "@/lib/demo-mode";

type ContextType = "listing" | "offer" | "contract" | "appointment" | "client";

type Props = {
  contextType: ContextType;
  contextId: string;
  label: string;
  className?: string;
  style?: React.CSSProperties;
  /** Staging: MESSAGE_BROKER_CLICKED metadata */
  demoListingId?: string;
};

export function OpenContextConversationButton({
  contextType,
  contextId,
  label,
  className,
  style,
  demoListingId,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const demo = isPublicDemoMode();

  async function onClick() {
    setErr(null);
    setLoading(true);
    try {
      if (process.env.NEXT_PUBLIC_ENV === "staging" && contextType === "listing" && demoListingId) {
        void fetch("/api/demo/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            event: DemoEvents.MESSAGE_BROKER_CLICKED,
            metadata: { listingId: demoListingId },
          }),
        }).catch(() => {});
      }

      const res = await fetch("/api/conversations/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ type: contextType, contextId }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; conversationId?: string };
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/auth/login?next=${encodeURIComponent("/dashboard/messages")}`);
          return;
        }
        setErr(j.error ?? "Could not open conversation");
        return;
      }
      if (j.conversationId) {
        router.push(`/dashboard/messages?conversationId=${encodeURIComponent(j.conversationId)}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        disabled={loading}
        onClick={() => void onClick()}
        className={
          className ??
          "rounded-lg border border-[#C9A96E]/50 bg-[#C9A96E]/10 px-4 py-2 text-sm font-semibold text-[#C9A96E] hover:bg-[#C9A96E]/20 disabled:opacity-50"
        }
        style={style}
      >
        {loading ? "Opening…" : label}
      </button>
      {demo ? (
        <p className="text-[10px] text-slate-500">
          This is a demo conversation environment. No external message is sent.
        </p>
      ) : null}
      {err ? <p className="text-xs text-rose-400">{err}</p> : null}
    </div>
  );
}
