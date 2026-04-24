"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Shield,
  ShieldAlert,
  FileWarning,
  Send,
  Landmark,
  Wallet2,
  Scale,
  ClipboardList,
  ScanSearch,
  FileOutput,
  ListChecks,
  Radar,
  Ban,
  ShieldCheck,
  Users,
  Archive,
} from "lucide-react";

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

      <section className="rounded-2xl border border-sky-900/30 bg-sky-950/15 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
          <Wallet2 className="h-4 w-4 text-sky-400" aria-hidden />
          Financial records &amp; registers
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Receipt-of-cash workflow, ledger lines, and period registers — trust vs operating vs platform revenue. No
          financial deletions; corrections via reversal entries.
        </p>
        <Link
          href="/dashboard/broker/financial"
          className="mt-4 inline-flex rounded-lg bg-sky-800/60 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700/80"
        >
          Open Financial Records
        </Link>
      </section>

      <section className="rounded-2xl border border-violet-900/30 bg-violet-950/15 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-100">
          <Scale className="h-4 w-4 text-violet-400" aria-hidden />
          Complaints &amp; public protection
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Intake, triage, public assistance vs syndic-oriented escalation — full event history, attachments, and referrals.
          AI assists with summaries only; accountable reviewers own routing and closure.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/broker/complaints"
            className="inline-flex rounded-lg bg-violet-800/60 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700/80"
          >
            Open complaints desk
          </Link>
          <Link
            href="/public/assistance"
            className="inline-flex rounded-lg border border-violet-500/40 px-4 py-2 text-sm font-medium text-violet-100 hover:bg-violet-900/30"
          >
            Public Help Center
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-emerald-900/30 bg-emerald-950/15 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
          <Landmark className="h-4 w-4 text-emerald-400" aria-hidden />
          Trust &amp; deposits (OACIQ)
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Record earnest money and separated vacation-resort security deposits, track holding and release requests, and keep
          an audit trail. Trust money must stay distinct from operating funds.
        </p>
        <Link
          href="/dashboard/broker/trust"
          className="mt-4 inline-flex rounded-lg bg-emerald-800/60 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700/80"
        >
          Open Trust &amp; Deposit Center
        </Link>
      </section>

      <section className="rounded-2xl border border-[#D4AF37]/25 bg-[#1a1508]/40 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
          <ClipboardList className="h-4 w-4" aria-hidden />
          Audit &amp; inspection readiness
        </div>
        <p className="mt-2 text-sm text-zinc-400">
          Hashed audit chronology, export bundles for reviews, and read-only inspection sessions. AI may summarize exports
          only — it does not alter evidence or legal conclusions.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/dashboard/broker/compliance"
            className="inline-flex rounded-lg border-2 border-[#D4AF37] bg-[#D4AF37]/10 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/20"
          >
            Compliance Center
          </Link>
          <Link
            href="/dashboard/broker/compliance/audit"
            className="inline-flex rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black hover:opacity-95"
          >
            Audit trail
          </Link>
          <Link
            href="/dashboard/broker/compliance/retention"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/35 px-4 py-2 text-sm font-medium text-amber-100 hover:bg-amber-950/35"
          >
            <Archive className="h-4 w-4" aria-hidden />
            Retention &amp; legal hold
          </Link>
          <Link
            href="/dashboard/broker/compliance/command-center"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/60 px-4 py-2 text-sm font-semibold text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            Command center
          </Link>
          <Link
            href="/dashboard/broker/compliance/verify-inform-advise"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-500/45 px-4 py-2 text-sm font-medium text-sky-100 hover:bg-sky-950/35"
          >
            Verify → Inform → Advise
          </Link>
          <Link
            href="/dashboard/broker/compliance/health"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-900/30"
          >
            Compliance health
          </Link>
          <Link
            href="/dashboard/broker/compliance/supervision"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-500/40 px-4 py-2 text-sm font-medium text-sky-200 hover:bg-sky-950/40"
          >
            <Users className="h-4 w-4" aria-hidden />
            Authorization &amp; supervision
          </Link>
          <Link
            href="/dashboard/broker/compliance/review-queue"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <ListChecks className="h-4 w-4" aria-hidden />
            Review queue
          </Link>
          <Link
            href="/dashboard/broker/compliance/inspection"
            className="inline-flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 px-4 py-2 text-sm font-medium text-[#D4AF37] hover:bg-[#D4AF37]/10"
          >
            <ScanSearch className="h-4 w-4" aria-hidden />
            Inspection mode
          </Link>
          <Link
            href="/dashboard/broker/compliance/advanced-ops"
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/5"
          >
            <FileOutput className="h-4 w-4" aria-hidden />
            Regulator export
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#1a1508]/30 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#D4AF37]">
            <Radar className="h-4 w-4" aria-hidden />
            Real-time guardrails
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Listing publish, offers, trust releases, receipts, and complaints are evaluated through the centralized engine;
            decisions are logged to the audit trail.
          </p>
        </div>
        <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-red-200">
            <Ban className="h-4 w-4" aria-hidden />
            Blocked actions
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Hard and soft blocks return reason codes to the client. Use the review queue when an outcome requires human
            approval.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-900/25 bg-emerald-950/10 p-5 md:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            Compliance prevention
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            Prevention-first checks run before irreversible steps (trust release, sealed bundles, inspection-mode writes).
            Agency-scoped queues stay separate from solo broker queues.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-900/30 bg-sky-950/15 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-100">
            <Users className="h-4 w-4" aria-hidden />
            Supervision &amp; delegation
          </div>
          <p className="mt-2 text-sm text-zinc-400">
            License-aware roles, explicit delegations, and accountability records — employees assist; brokers remain
            accountable for finals.
          </p>
          <Link
            href="/dashboard/broker/compliance/supervision"
            className="mt-3 inline-flex text-sm font-medium text-sky-300 underline-offset-4 hover:underline"
          >
            Open supervision center
          </Link>
        </div>
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-950/30 p-5">
          <h3 className="text-sm font-semibold text-zinc-200">Accountability chain</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Every regulated step can emit an accountability row (who performed vs who is answerable).
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-700/50 bg-zinc-950/30 p-5">
          <h3 className="text-sm font-semibold text-zinc-200">Approval tasks</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Delegated preparatory work can queue a `DelegatedApprovalTask` before brokers finalize.
          </p>
        </div>
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
