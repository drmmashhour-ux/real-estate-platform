import Link from "next/link";
import { ALL_LEGAL_GATE_ACTIONS } from "@/modules/legal/legal-enforcement-rules";
import { evaluateLegalGate } from "@/modules/legal/legal-gate.service";
import type { LegalHubActorType, LegalHubSummary } from "@/modules/legal/legal.types";

const ACTION_LABEL: Record<string, string> = {
  publish_listing: "Publish / verify listing (FSBO or host path)",
  start_booking: "Start a booking",
  complete_booking: "Complete a stay or booking",
  submit_offer: "Submit an offer",
  accept_offer: "Accept an offer",
  activate_host_listing: "Activate a short-term / host listing",
  unlock_contact: "Unlock or pay to contact a lead",
  become_broker: "Broker application or mandate",
};

type Props = {
  summary: Pick<LegalHubSummary, "workflows" | "risks" | "actorType">;
  hubPath: string;
};

/**
 * Read-only: which platform actions are **hard/soft gated** for the current Legal Hub snapshot
 * (uses the same `evaluateLegalGate` engine as marketplace policy).
 */
export function LegalBlockingActionsSection({ summary, hubPath }: Props) {
  const ctx = {
    actorType: summary.actorType as LegalHubActorType,
    workflows: summary.workflows,
    risks: summary.risks,
  };

  const rows = ALL_LEGAL_GATE_ACTIONS.map((action) => {
    const g = evaluateLegalGate(action, ctx);
    return { action, ...g };
  }).filter((r) => !r.allowed || r.mode === "soft");

  if (rows.length === 0) {
    return (
      <section
        className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100/90"
        aria-label="Action gating"
      >
        <p className="font-semibold text-emerald-200/95">Action gating (checklist)</p>
        <p className="mt-1 text-xs text-emerald-100/80">
          No additional hard or soft platform blocks detected for your current role and records. This is an operational
          summary only — not a legal opinion.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-4 py-3 text-sm" aria-label="Action gating">
      <p className="font-semibold text-amber-200/95">Actions with checklist or advisory items</p>
      <p className="mt-1 text-xs text-amber-100/80">
        The same rules power the autonomous marketplace policy engine. Address items in your workflow, then retry the
        action. <span className="text-amber-200/90">Not legal advice.</span>
      </p>
      <ul className="mt-3 space-y-2 text-xs text-amber-100/90">
        {rows.map((r) => (
          <li key={r.action} className="rounded-lg border border-amber-500/15 bg-black/20 px-3 py-2">
            <p className="font-medium text-amber-200/95">
              {ACTION_LABEL[r.action] ?? r.action}{" "}
              <span className="text-amber-100/70">({r.mode === "soft" ? "advisory" : "blocked"})</span>
            </p>
            {r.reasons.length > 0 ? (
              <ul className="mt-1 list-disc pl-4 text-amber-100/80">
                {r.reasons.slice(0, 4).map((x, i) => (
                  <li key={i}>{x}</li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-amber-100/70">
        <Link href={hubPath} className="text-premium-gold hover:underline">
          Open Legal Hub
        </Link>{" "}
        to update workflow status and documents.
      </p>
    </section>
  );
}
