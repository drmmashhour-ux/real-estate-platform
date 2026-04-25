"use client";

import Link from "next/link";
import { useState } from "react";
import NoticeBlock from "@/components/NoticeBlock";
import { DetectedNotice } from "@/modules/notice-engine/noticeEngine";

type Props = {
  initialType: string | null;
};

export function DraftFormClient({ initialType }: Props) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [notices, setNotices] = useState<DetectedNotice[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const typeLabel = initialType?.replace(/_/g, " ") ?? "form";

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    setNotices([]);
    try {
      const res = await fetch("/api/ai/draft-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ type: initialType, input }),
      });
      const data = (await res.json()) as { text?: string; notices?: DetectedNotice[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Request failed");
        setOutput("");
        return;
      }
      setOutput(typeof data.text === "string" ? data.text : "");
      setNotices(Array.isArray(data.notices) ? data.notices : []);
    } catch {
      setError("Network error");
      setOutput("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[#D4AF37]">Draft: {typeLabel}</h1>
        <Link href="/dashboard/broker/forms" className="text-sm text-[#D4AF37] hover:underline">
          ← Forms Hub
        </Link>
      </div>

      <div className="text-xs text-gray-500">
        This tool assists drafting based on OACIQ practices. Official forms must be reviewed and completed by a licensed
        broker.
      </div>

      <textarea
        className="h-40 w-full border border-gray-700 bg-black p-3 text-white"
        placeholder="Enter details…"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleGenerate()}
        className="bg-[#D4AF37] px-4 py-2 font-semibold text-black disabled:opacity-50"
      >
        {busy ? "Generating…" : "Generate Draft"}
      </button>

      {error ? (
        <div className="border border-red-500/40 bg-red-950/30 p-3 text-sm text-red-200">{error}</div>
      ) : null}

      {notices.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Compliance Notices</p>
          {notices.map((n, i) => (
            <NoticeBlock key={i} notice={n} />
          ))}
        </div>
      )}

      <div className="border border-gray-700 bg-black p-4 text-white whitespace-pre-wrap">
        {output || "AI output will appear here"}
      </div>
    </div>
  );
}
