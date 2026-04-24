"use client";

import { useEffect, useState, useTransition } from "react";

type Props = { playbookId: string; canControl: boolean };

export function PlaybookControls({ playbookId, canControl }: Props) {
  const [versionId, setVersionId] = useState("");
  const [reason, setReason] = useState("");
  const [scopeType, setScopeType] = useState("playbook");
  const [scopeKey, setScopeKey] = useState("");
  const [cap, setCap] = useState("");
  const [domainKey, setDomainKey] = useState("");
  const [forceMode, setForceMode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    setScopeKey(playbookId);
  }, [playbookId]);

  if (!canControl) {
    return <p className="text-xs text-white/40">Read-only: admin role required to send control actions.</p>;
  }

  const post = (action: string, body: Record<string, unknown> = {}) => {
    setMessage(null);
    start(async () => {
      try {
        const r = await fetch("/api/playbook-memory/control", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, playbookId, playbookVersionId: versionId || undefined, reason: reason || undefined, ...body }),
        });
        const j = (await r.json().catch(() => ({}))) as { ok?: boolean; error?: string; result?: unknown };
        if (j?.ok) {
          setMessage("OK");
        } else {
          setMessage(j?.error ? String(j.error) : "failed");
        }
      } catch {
        setMessage("network");
      }
    });
  };

  const onSetCap = () => {
    const c = parseFloat(cap);
    if (!scopeKey.trim() || !Number.isFinite(c)) {
      setMessage("scope key + cap required");
      return;
    }
    post("set_exploration_cap", { scopeType, scopeKey: scopeKey.trim(), cap: c });
  };

  const onForceMode = () => {
    if (!domainKey.trim() || !forceMode.trim()) {
      setMessage("domain + mode required");
      return;
    }
    post("set_domain_force_mode", { domainKey: domainKey.trim(), forceMode: forceMode.trim() });
  };

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-[#080808] p-3 text-sm text-white/80">
      <p className="text-xs font-semibold uppercase text-[#D4AF37]">Controls (explicit click)</p>
      <p className="text-xs text-white/45">Pause, resume, or promote a version. All actions are logged by the memory engine.</p>
      <input
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
        placeholder="Version id to promote (cuid)"
        value={versionId}
        onChange={(e) => setVersionId(e.target.value)}
      />
      <input
        className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
        placeholder="Reason (optional, audit trail)"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => post("pause_playbook")}
          className="rounded border border-amber-500/30 bg-amber-900/20 px-3 py-1 text-xs text-amber-100 hover:bg-amber-900/40"
        >
          Pause
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => post("resume_playbook")}
          className="rounded border border-emerald-500/30 bg-emerald-900/20 px-3 py-1 text-xs text-emerald-100 hover:bg-emerald-900/40"
        >
          Resume
        </button>
        <button
          type="button"
          disabled={pending || !versionId.trim()}
          onClick={() => post("promote_playbook_version")}
          className="rounded border border-[#D4AF37]/40 bg-[#1a1508] px-3 py-1 text-xs text-[#D4AF37] hover:bg-[#2a2010]"
        >
          Promote version
        </button>
      </div>
      <div className="mt-3 border-t border-white/5 pt-3">
        <p className="text-xs font-semibold text-[#D4AF37]/80">Control settings (persisted; audited)</p>
        <p className="text-xs text-white/40">Does not start/stop background jobs on its own — only stores operator policy rows.</p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input
            className="w-24 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            placeholder="scopeType"
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value)}
          />
          <input
            className="min-w-[140px] flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            placeholder="scopeKey (e.g. playbook id or domain id)"
            value={scopeKey}
            onChange={(e) => setScopeKey(e.target.value)}
          />
          <input
            className="w-20 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            placeholder="cap"
            value={cap}
            onChange={(e) => setCap(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onSetCap}
            className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/5"
          >
            Set exploration cap
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <input
            className="min-w-[120px] flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            placeholder="domain key"
            value={domainKey}
            onChange={(e) => setDomainKey(e.target.value)}
          />
          <input
            className="min-w-[120px] flex-1 rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white"
            placeholder="force mode string"
            value={forceMode}
            onChange={(e) => setForceMode(e.target.value)}
          />
          <button
            type="button"
            disabled={pending}
            onClick={onForceMode}
            className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/5"
          >
            Set domain force
          </button>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => post("set_emergency_freeze", { freeze: true })}
            className="rounded border border-rose-500/40 bg-rose-950/30 px-2 py-1 text-xs text-rose-100/90"
          >
            Emergency freeze ON
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => post("set_emergency_freeze", { freeze: false })}
            className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/5"
          >
            Emergency freeze OFF
          </button>
        </div>
      </div>
      {message ? <p className="text-xs text-white/50">Last: {message}</p> : null}
    </div>
  );
}
