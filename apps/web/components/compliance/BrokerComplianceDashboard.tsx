"use client";

import { useState } from "react";
import { Shield, ShieldAlert, FileWarning, Send } from "lucide-react";

type Props = {
  initialStatus: {
    hasPolicy: boolean;
    status: string;
    message: string;
    policy: {
      provider: string;
      coveragePerLoss: number;
      coveragePerYear: number;
      endDate: string;
      deductibleLevel: number;
      policyNumber: string | null;
    } | null;
  };
  initialScore: {
    score: number;
    label: string;
    openRisks: number;
    lastEventAt: string | null;
  };
  initialRisk: {
    riskScore: number;
    flags: string[];
    severity: string;
  };
};

export function BrokerComplianceDashboard({
  initialStatus,
  initialScore,
  initialRisk,
}: Props) {
  const [claimText, setClaimText] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function submitClaim() {
    setBusy(true);
    setFeedback(null);
    try {
      const r = await fetch("/api/insurance/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ summary: claimText, status: "SUBMITTED" }),
      });
      const data = (await r.json()) as { error?: string; success?: boolean };
      if (!r.ok) {
        setFeedback(data.error ?? "Failed");
        return;
      }
      setFeedback("Claim submitted — reference logged internally.");
      setClaimText("");
    } catch {
      setFeedback("Network error");
    } finally {
      setBusy(false);
    }
  }

  const active =
    initialStatus.hasPolicy &&
    initialStatus.status === "ACTIVE" &&
    initialStatus.policy &&
    new Date(initialStatus.policy.endDate).getTime() >= Date.now();

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 text-zinc-100">
      <header className="space-y-2 border-b border-white/10 pb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-500/90">LECIPM · FARCIQ</p>
        <h1 className="text-2xl font-semibold text-white">Insurance &amp; compliance</h1>
        <p className="text-sm text-zinc-400">
          Professional coverage snapshot and operational risk signals — platform guidance only, not legal advice.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Shield className="h-4 w-4 text-emerald-400" aria-hidden />
            Insurance status
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-white">{active ? "ACTIVE" : initialStatus.status}</p>
          <p className="mt-2 text-sm text-zinc-400">{initialStatus.message}</p>
          {initialStatus.policy ? (
            <ul className="mt-4 space-y-1 text-xs text-zinc-500">
              <li>Provider: {initialStatus.policy.provider}</li>
              <li>Policy #: {initialStatus.policy.policyNumber ?? "—"}</li>
              <li>Term ends: {new Date(initialStatus.policy.endDate).toLocaleDateString("en-CA")}</li>
            </ul>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/40 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldAlert className="h-4 w-4 text-amber-400" aria-hidden />
            Compliance score
          </div>
          <p className="mt-3 text-3xl font-bold tabular-nums text-white">
            {initialScore.score}
            <span className="text-lg font-normal text-zinc-500">/100</span>
          </p>
          <p className="mt-1 text-sm text-zinc-400">{initialScore.label}</p>
          <p className="mt-3 text-xs text-zinc-500">
            Open risk signals: {initialScore.openRisks}
            {initialScore.lastEventAt ? ` · Last event ${initialScore.lastEventAt.slice(0, 10)}` : ""}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="text-sm font-semibold text-white">Coverage (FARCIQ parameters)</h2>
        {initialStatus.policy ? (
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Per loss</dt>
              <dd className="font-mono text-white">
                ${(initialStatus.policy.coveragePerLoss / 1_000_000).toFixed(1)}M CAD
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Annual aggregate</dt>
              <dd className="font-mono text-white">
                ${(initialStatus.policy.coveragePerYear / 1_000_000).toFixed(1)}M CAD
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Deductible tier</dt>
              <dd className="font-mono text-white">${initialStatus.policy.deductibleLevel.toLocaleString()} CAD</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-sm text-zinc-500">No policy row — add coverage in admin or seed for testing.</p>
        )}
      </section>

      <section className="rounded-2xl border border-amber-900/30 bg-amber-950/20 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-amber-100">
          <FileWarning className="h-4 w-4" aria-hidden />
          Risk alerts
        </div>
        <p className="mt-1 text-xs text-amber-200/70">Engine severity: {initialRisk.severity} · score {initialRisk.riskScore}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-100/90">
          {initialRisk.flags.length === 0 ? (
            <li>No automated flags in the current window.</li>
          ) : (
            initialRisk.flags.map((f) => <li key={f}>{f}</li>)
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-white/10 bg-black/40 p-5">
        <h2 className="text-sm font-semibold text-white">Report a claim (summary only)</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Do not paste privileged legal instructions. Long-form documents should attach via your secure workflow when enabled
          (<span className="font-mono">privateFileId</span>).
        </p>
        <textarea
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          rows={4}
          placeholder="Short factual summary for internal routing…"
          value={claimText}
          onChange={(e) => setClaimText(e.target.value)}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void submitClaim()}
          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-700/80 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden />
          {busy ? "Sending…" : "Submit claim intake"}
        </button>
        {feedback ? <p className="mt-2 text-sm text-zinc-400">{feedback}</p> : null}
      </section>
    </div>
  );
}
