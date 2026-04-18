import { buildGovernanceAlerts } from "@/services/governance/governance-alert.service";
import { getIpSecurityGovernanceSnapshot } from "@/services/governance/ip-security-governance.service";

function Tick({ ok }: { ok: boolean }) {
  return <span aria-label={ok ? "yes" : "no"}>{ok ? "✅" : "❌"}</span>;
}

function Law25Icon({ ok }: { ok: boolean }) {
  return <span aria-label={ok ? "checklist present" : "checklist missing"}>{ok ? "✅" : "⚠️"}</span>;
}

function riskTone(level: "low" | "medium" | "high"): string {
  if (level === "low") return "text-emerald-400/90";
  if (level === "medium") return "text-amber-300/90";
  return "text-red-400/90";
}

/** Read-only IP & security governance strip for the Company Command Center (observational). */
export async function IpSecurityGovernanceBlock() {
  const snap = getIpSecurityGovernanceSnapshot();
  const { alerts, highestSeverity } = buildGovernanceAlerts(snap);

  return (
    <section className="rounded-2xl border border-ds-border bg-ds-card/90 p-5 shadow-ds-soft">
      <h2 className="font-serif text-lg text-ds-text">IP &amp; Security Governance</h2>
      <p className="mt-1 text-xs text-ds-text-secondary">
        Observational dashboard — not a legal audit or security certification. Derived from in-repo docs and heuristics.
      </p>

      <div className="mt-4 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <h3 className="mb-2 font-medium text-ds-gold/90">Legal</h3>
          <ul className="space-y-1 text-ds-text-secondary">
            <li>
              Terms: <Tick ok={snap.legal.termsOfServicePresent} />
            </li>
            <li>
              Privacy: <Tick ok={snap.legal.privacyPolicyPresent} />
            </li>
            <li>
              NDA templates: <Tick ok={snap.legal.ndaTemplatesPresent} />
            </li>
            <li>
              Acceptable use: <Tick ok={snap.legal.acceptableUsePresent} />
            </li>
            <li>
              Law 25 readiness (doc): <Law25Icon ok={snap.legal.law25ChecklistPresent} />
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-ds-gold/90">IP protection</h3>
          <ul className="space-y-1 text-ds-text-secondary">
            <li>
              Core logic protected (heuristic):{" "}
              <span className={snap.ip.proprietaryLogicProtected ? "text-emerald-400/90" : "text-amber-300/90"}>
                {snap.ip.proprietaryLogicProtected ? "✅" : "⚠️"}
              </span>
            </li>
            <li>
              IP checklist: <Tick ok={snap.ip.ipChecklistPresent} />
            </li>
            <li className="text-[11px] text-ds-text-secondary/80">Trademark: {snap.ip.trademarkStatus}</li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-ds-gold/90">Security (docs)</h3>
          <ul className="space-y-1 text-ds-text-secondary">
            <li>
              API: <StatusDot ok={snap.security.apiSecurityReviewed} />
            </li>
            <li>
              Auth / sessions: <StatusDot ok={snap.security.authReviewDone} />
            </li>
            <li>
              Stripe: <StatusDot ok={snap.security.stripeSecurityReviewed} />
            </li>
            <li>
              Database TLS: <StatusDot ok={snap.security.dbSecurityReviewed} />
            </li>
            <li>
              AI / admin posture: <StatusDot ok={snap.security.aiAdminReviewDone} />
            </li>
            <li>
              Secrets in repo: <StatusDot ok={snap.security.secretsChecklistDone} />
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 font-medium text-ds-gold/90">Production risk</h3>
          <p className={`font-medium ${riskTone(snap.summary.overallRiskLevel)}`}>
            Overall: {snap.summary.overallRiskLevel}
          </p>
          <p className="mt-1 text-[11px] text-ds-text-secondary">
            Readiness score:{" "}
            {snap.production.productionReadyScore != null ? `${Math.round(snap.production.productionReadyScore * 100)}%` : "—"}{" "}
            {snap.production.productionReadyNote ? <span className="block opacity-80">{snap.production.productionReadyNote}</span> : null}
          </p>
          <p className="mt-1 text-[11px] text-ds-text-secondary">{snap.production.incidentsNote}</p>
          <p className="mt-2 text-[11px] text-ds-text-secondary">
            Alerts (observational): {alerts.length} · highest: {highestSeverity}
          </p>
        </div>
      </div>

      {snap.summary.criticalGaps.length > 0 ? (
        <div className="mt-4 rounded-lg border border-red-900/40 bg-red-950/20 p-3">
          <p className="text-xs font-medium text-red-200/90">Critical / priority gaps</p>
          <ul className="mt-1 list-inside list-disc text-[11px] text-ds-text-secondary">
            {snap.summary.criticalGaps.slice(0, 6).map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {snap.summary.warnings.length > 0 ? (
        <div className="mt-3 rounded-lg border border-amber-900/30 bg-amber-950/15 p-3">
          <p className="text-xs font-medium text-amber-200/90">Warnings</p>
          <ul className="mt-1 list-inside list-disc text-[11px] text-ds-text-secondary">
            {snap.summary.warnings.slice(0, 4).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return <span className={ok ? "text-emerald-400/90" : "text-amber-300/90"}>{ok ? "ok" : "review"}</span>;
}
