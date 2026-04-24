"use client";

import * as React from "react";
import { OACIQ_BROKER_MANDATORY_ACK_TEXT } from "@/lib/approval/oaciq-broker-ack";

type Eligibility = { tier: "low" | "high"; reasons: string[] };

type Preflight = {
  eligibility?: Eligibility;
  sessionBroker?: { displayName: string; email: string; preAuthenticated?: boolean };
  stepUp?: { pinRequired: boolean; note?: string };
  fullApprovalPath?: string;
  disclaimer?: string;
};

export function BrokerQuickSignPanel(props: { dealId: string; brokerDisplayName: string; brokerEmail: string }) {
  const { dealId, brokerDisplayName, brokerEmail } = props;
  const [preflight, setPreflight] = React.useState<Preflight | null>(null);
  const [open, setOpen] = React.useState(false);
  const [intent, setIntent] = React.useState(
    "I approve execution readiness for this deal after reviewing the draft assistance shown in this workspace.",
  );
  const [pin, setPin] = React.useState("");
  const [oaciqAck, setOaciqAck] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [doneId, setDoneId] = React.useState<string | null>(null);

  const loadPreflight = React.useCallback(async () => {
    setMsg(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/broker/quick-sign`, { credentials: "include" });
      const data = (await res.json()) as Preflight & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Preflight failed");
      setPreflight(data);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Preflight failed");
    }
  }, [dealId]);

  React.useEffect(() => {
    void loadPreflight();
  }, [loadPreflight]);

  const tier = preflight?.eligibility?.tier ?? "low";
  const blocked = tier === "high";
  const pinRequired = Boolean(preflight?.stepUp?.pinRequired);

  async function submit() {
    setBusy(true);
    setMsg(null);
    setDoneId(null);
    try {
      const res = await fetch(`/api/deals/${dealId}/broker/quick-sign`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          stepUpPin: pinRequired || pin.trim() ? pin.trim() : undefined,
          clientCapability:
            typeof globalThis.PublicKeyCredential !== "undefined" ? "webauthn_available" : "webauthn_unavailable",
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        approvalId?: string;
        error?: string;
        requiresFullFlow?: boolean;
        fullApprovalPath?: string;
        eligibility?: Eligibility;
      };
      if (res.status === 409 && data.requiresFullFlow) {
        setMsg(
          `High-risk file — use the full approval flow with validation. ${data.eligibility?.reasons?.join(" ") ?? ""}`,
        );
        return;
      }
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Quick sign failed");
      setDoneId(data.approvalId ?? "ok");
      setOpen(false);
      setPin("");
      setOaciqAck(false);
      await loadPreflight();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Quick sign failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/20 p-6">
      <h2 className="font-serif text-lg text-emerald-100">1-click broker approval</h2>
      <p className="mt-1 text-xs text-emerald-100/70">
        Pre-authenticated session: <span className="font-medium text-emerald-50">{brokerDisplayName}</span> ({brokerEmail}
        ). Face ID / platform biometrics can augment step-up when WebAuthn is enabled for your tenant.
      </p>
      {preflight?.disclaimer ? <p className="mt-2 text-[11px] text-zinc-400">{preflight.disclaimer}</p> : null}

      {doneId ? (
        <p className="mt-3 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          Signature recorded — approval <span className="font-mono text-xs">{doneId}</span>. Traceable in deal execution
          audit.
        </p>
      ) : null}

      {msg ? (
        <p className="mt-3 text-sm text-rose-300" role="alert">
          {msg}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={blocked || busy}
          onClick={() => {
            setOpen(true);
            void loadPreflight();
          }}
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve &amp; Sign
        </button>
        {blocked ? (
          <span className="text-xs text-amber-200">
            Quick sign disabled — {preflight?.eligibility?.reasons?.[0] ?? "use full flow."}
          </span>
        ) : (
          <span className="text-xs text-zinc-500">Secured session + confirmation modal{pinRequired ? " + PIN" : ""}.</span>
        )}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-sign-title"
        >
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl">
            <h3 id="quick-sign-title" className="text-lg font-semibold text-zinc-50">
              Confirm approval
            </h3>
            <p className="mt-2 text-xs text-zinc-400">
              You are attesting broker review under your license. This does not auto-submit OACIQ forms or external
              envelopes.
            </p>
            <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              What you approve (required)
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                rows={4}
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
              />
            </label>
            <label className="mt-4 flex cursor-pointer gap-3 rounded-lg border border-zinc-700 bg-zinc-950/80 p-3 text-sm text-zinc-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600"
                checked={oaciqAck}
                onChange={(e) => setOaciqAck(e.target.checked)}
                required
              />
              <span>{OACIQ_BROKER_MANDATORY_ACK_TEXT}</span>
            </label>
            {pinRequired ? (
              <label className="mt-3 block text-xs font-medium uppercase tracking-wide text-zinc-500">
                Step-up PIN
                <input
                  type="password"
                  autoComplete="one-time-code"
                  className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                />
              </label>
            ) : (
              <p className="mt-3 text-[11px] text-zinc-500">
                Optional PIN: enable <code className="text-zinc-400">BROKER_QUICK_SIGN_REQUIRE_PIN</code> or strict 2FA
                for this user.
              </p>
            )}
            {preflight?.stepUp?.note ? <p className="mt-2 text-[10px] text-zinc-500">{preflight.stepUp.note}</p> : null}
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-200"
                onClick={() => setOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={busy || intent.trim().length < 8 || !oaciqAck}
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
                onClick={() => void submit()}
              >
                {busy ? "Recording…" : "Confirm & record"}
              </button>
            </div>
            {preflight?.fullApprovalPath ? (
              <p className="mt-4 text-[10px] text-zinc-500">
                Full validation path:{" "}
                <code className="break-all text-zinc-400">{preflight.fullApprovalPath}</code>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
