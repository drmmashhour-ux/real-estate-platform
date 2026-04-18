"use client";

import { useCallback, useEffect, useState } from "react";

type Props = {
  dealId: string;
  canMutate: boolean;
  showSignature: boolean;
  showRealProviderSend: boolean;
  showNotary: boolean;
  showClosing: boolean;
};

export function SignatureNotaryClosingPanels({
  dealId,
  canMutate,
  showSignature,
  showRealProviderSend,
  showNotary,
  showClosing,
}: Props) {
  const [sig, setSig] = useState<unknown>(null);
  const [notaries, setNotaries] = useState<unknown>(null);
  const [closing, setClosing] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [notaryId, setNotaryId] = useState("");
  const [formKey, setFormKey] = useState("PP");
  const [provider, setProvider] = useState<"docusign" | "pandadoc">("docusign");
  const [participantsJson, setParticipantsJson] = useState("");

  const refresh = useCallback(async () => {
    setErr(null);
    try {
      if (showSignature) {
        const r = await fetch(`/api/deals/${dealId}/signature/status`, { credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error((j as { error?: string }).error ?? "Signature status failed");
        setSig(j);
      }
      if (showNotary) {
        const r = await fetch(`/api/notaries?dealId=${encodeURIComponent(dealId)}`, { credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error((j as { error?: string }).error ?? "Notaries failed");
        setNotaries(j);
      }
      if (showClosing) {
        const r = await fetch(`/api/deals/${dealId}/closing-status`, { credentials: "include" });
        const j = await r.json();
        if (!r.ok) throw new Error((j as { error?: string }).error ?? "Closing status failed");
        setClosing(j);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error");
    }
  }, [dealId, showClosing, showNotary, showSignature]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendToProvider = async () => {
    if (!canMutate) return;
    setErr(null);
    try {
      const participants = JSON.parse(participantsJson) as { name: string; role: string; email: string }[];
      if (!Array.isArray(participants) || participants.length === 0) {
        throw new Error("participants JSON must be a non-empty array");
      }
      const res = await fetch("/api/signature/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId, formKey, provider, participants }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Send failed");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Send error");
    }
  };

  const selectNotary = async () => {
    if (!canMutate || !notaryId.trim()) return;
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/notary/select`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaryId: notaryId.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Select failed");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Select error");
    }
  };

  const inviteNotary = async () => {
    if (!canMutate || !notaryId.trim()) return;
    setErr(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/notary/invite`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notaryId: notaryId.trim() }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? "Invite failed");
      await refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Invite error");
    }
  };

  if (!showSignature && !showNotary && !showClosing) return null;

  return (
    <div className="space-y-6">
      {err ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-2 text-sm text-amber-200" role="alert">
          {err}
        </p>
      ) : null}

      {showSignature ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
          <h2 className="font-serif text-lg text-amber-50">Signature status</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Status comes from your e-sign provider webhooks — never edited manually on the platform.
          </p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] text-zinc-300">
            {JSON.stringify(sig, null, 2)}
          </pre>
          {canMutate && showRealProviderSend ? (
            <div className="mt-4 space-y-3 border-t border-white/5 pt-4">
              <p className="text-xs text-zinc-500">
                Send requires broker approval, real provider credentials, and exact signer emails. Paste a JSON array of{" "}
                <code className="text-amber-200/90">{"{ name, role, email }"}</code> objects — roles should be buyer,
                seller, or broker for anchor placement.
              </p>
              <div className="flex flex-wrap gap-2">
                <input
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  aria-label="Form key"
                />
                <select
                  className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as "docusign" | "pandadoc")}
                >
                  <option value="docusign">DocuSign</option>
                  <option value="pandadoc">PandaDoc</option>
                </select>
              </div>
              <textarea
                className="min-h-[100px] w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-xs text-zinc-200"
                placeholder='[{"name":"…","role":"buyer","email":"…"}]'
                value={participantsJson}
                onChange={(e) => setParticipantsJson(e.target.value)}
                aria-label="Participants JSON"
              />
              <button
                type="button"
                className="rounded-lg bg-amber-600/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-500 disabled:opacity-40"
                disabled={!participantsJson.trim()}
                onClick={() => void sendToProvider()}
              >
                Send bundle (real provider)
              </button>
            </div>
          ) : canMutate && !showRealProviderSend ? (
            <p className="mt-4 text-xs text-zinc-500">
              Real-provider send is disabled. Enable{" "}
              <code className="text-amber-200/90">FEATURE_SIGNATURE_REAL_PROVIDERS_V1</code> and configure provider credentials.
            </p>
          ) : null}
        </section>
      ) : null}

      {showNotary ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
          <h2 className="font-serif text-lg text-amber-50">Notary directory</h2>
          <p className="mt-1 text-xs text-zinc-500">Select and record an invitation — broker responsibility to complete outreach.</p>
          <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] text-zinc-300">
            {JSON.stringify(notaries, null, 2)}
          </pre>
          {canMutate ? (
            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="text-xs text-zinc-500">
                Notary ID
                <input
                  className="ml-2 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm text-zinc-100"
                  value={notaryId}
                  onChange={(e) => setNotaryId(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                onClick={() => void selectNotary()}
              >
                Select
              </button>
              <button
                type="button"
                className="rounded-lg bg-amber-600/90 px-3 py-1.5 text-sm font-medium text-zinc-950 hover:bg-amber-500"
                onClick={() => void inviteNotary()}
              >
                Record invitation
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {showClosing ? (
        <section className="rounded-2xl border border-white/10 bg-zinc-950/80 p-6">
          <h2 className="font-serif text-lg text-amber-50">Closing readiness</h2>
          <p className="mt-1 text-xs text-zinc-500">Checklist — not a legal opinion on file completeness.</p>
          <pre className="mt-4 max-h-48 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 font-mono text-[11px] text-zinc-300">
            {JSON.stringify(closing, null, 2)}
          </pre>
        </section>
      ) : null}
    </div>
  );
}
