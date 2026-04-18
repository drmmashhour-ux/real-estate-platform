import { ExecutionAuditTrailCard } from "./ExecutionAuditTrailCard";

/**
 * Operator surface: API entry points for controlled execution (admin session + flags required).
 */
export function ControlledExecutionPanel() {
  return (
    <section className="rounded-xl border border-emerald-900/40 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-emerald-200">Controlled execution (API)</h2>
      <p className="mt-2 text-sm text-slate-400">
        Gates: policy → governance → safe execution → optional approval queue. Preview paths never mutate.
      </p>
      <ul className="mt-4 flex flex-col gap-2 text-sm text-emerald-400">
        <li>
          <code className="text-emerald-200">POST /api/admin/autonomy/execute</code> — explicit controlled run (body: targetType,
          targetId, dryRun)
        </li>
        <li>
          <code className="text-emerald-200">GET /api/admin/autonomy/approvals</code> — pending approval rows
        </li>
        <li>
          <code className="text-emerald-200">POST /api/admin/autonomy/approve</code> /{" "}
          <code className="text-emerald-200">reject</code> — resolve queue (body: approvalId)
        </li>
        <li>
          <code className="text-emerald-200">GET /api/admin/dashboard-intelligence</code> — unified marketplace dashboard JSON (
          <span className="text-slate-500">FEATURE_MARKETPLACE_DASHBOARD_V1</span>)
        </li>
        <li>
          <code className="text-emerald-200">GET /api/admin/market-domination</code> — advisory domination summary (
          <span className="text-slate-500">FEATURE_MARKET_DOMINATION_V1</span>)
        </li>
      </ul>
      <div className="mt-4">
        <ExecutionAuditTrailCard
          lines={[
            "Append-only rows in autonomy_execution_audit_logs when FEATURE_CONTROLLED_EXECUTION_V1 is on.",
            "Approvals in autonomy_pending_action_approvals when FEATURE_AUTONOMY_APPROVALS_V1 is on.",
          ]}
        />
      </div>
    </section>
  );
}
