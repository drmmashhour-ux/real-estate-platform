"use client";

import { useEffect, useState } from "react";
import { ContentLicenseRequiredError } from "@/lib/legal/content-license-client";

import { VoiceRecorderControls } from "@/components/messaging/VoiceRecorderControls";

type Props = {
  disabled?: boolean;
  disabledReason?: string;
  onSend: (body: string) => Promise<void>;
  /** Append AI suggestion or template text when `nonce` changes (does not send). */
  appendDraft?: { nonce: number; text: string } | null;
  onSendVoice?: (blob: Blob, durationSec: number, mimeType: string) => Promise<void>;
};

export function MessageComposer({ disabled, disabledReason, onSend, appendDraft, onSendVoice }: Props) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!appendDraft?.text.trim()) return;
    const next = appendDraft.text.trim();
    setText((prev) => {
      const base = prev.trim();
      return base ? `${base}\n\n${next}` : next;
    });
    // Intentionally keyed by nonce only — parent bumps nonce when applying a new AI draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appendDraft?.nonce]);

  async function submit() {
    const t = text.trim();
    if (!t || sending || disabled) return;
    setErr(null);
    setSending(true);
    try {
      await onSend(t);
      setText("");
    } catch (e) {
      if (e instanceof ContentLicenseRequiredError) {
        return;
      }
      setErr(e instanceof Error ? e.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="border-t border-white/10 bg-black/40 p-3">
      {disabled ? (
        <p className="mb-2 text-xs text-slate-500">{disabledReason ?? "You cannot send messages in this thread."}</p>
      ) : null}
      {err ? <p className="mb-2 text-xs text-rose-400">{err}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a message…"
          rows={3}
          disabled={disabled || sending}
          className="min-h-[72px] flex-1 resize-y rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 disabled:opacity-50"
        />
        <button
          type="button"
          disabled={disabled || sending || !text.trim()}
          onClick={() => void submit()}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40"
        >
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
      {onSendVoice ? (
        <VoiceRecorderControls disabled={disabled || sending} onSendVoice={onSendVoice} />
      ) : null}
    </div>
  );
}
