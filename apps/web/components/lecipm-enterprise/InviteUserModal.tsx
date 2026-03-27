"use client";

import { useState } from "react";

const ROLE_OPTIONS = [
  "owner",
  "admin",
  "manager",
  "broker",
  "analyst",
  "viewer",
  "compliance_reviewer",
] as const;

export type InviteUserModalProps = {
  workspaceId: string;
  open: boolean;
  onClose: () => void;
  onInvited?: () => void;
};

export function InviteUserModal({ workspaceId, open, onClose, onInvited }: InviteUserModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("broker");
  const [sendEmail, setSendEmail] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tokenOut, setTokenOut] = useState<string | null>(null);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setTokenOut(null);
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, sendInviteEmail: sendEmail }),
      });
      const data = (await res.json()) as { error?: string; token?: string; emailSent?: boolean };
      if (!res.ok) {
        setMessage(data.error ?? "Invite failed");
        return;
      }
      if (data.token) setTokenOut(data.token);
      setMessage(data.emailSent ? "Invitation email sent." : "Invite created. Copy the token if needed.");
      onInvited?.();
      setEmail("");
    } catch {
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#111] p-6 text-slate-100 shadow-xl">
        <h2 className="text-lg font-semibold">Invite teammate</h2>
        <p className="mt-1 text-xs text-slate-500">Assign a workspace role. Email must match their LECIPM account to accept.</p>
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <label className="block text-sm">
            <span className="text-slate-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-400">Role</span>
            <select
              value={role}
              onChange={(ev) => setRole(ev.target.value)}
              className="mt-1 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" checked={sendEmail} onChange={(ev) => setSendEmail(ev.target.checked)} />
            Send invitation email
          </label>
          {message ? <p className="text-sm text-emerald-400/90">{message}</p> : null}
          {tokenOut ? (
            <p className="break-all rounded-md bg-white/5 p-2 font-mono text-xs text-amber-200/90">Token: {tokenOut}</p>
          ) : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-emerald-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send invite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
