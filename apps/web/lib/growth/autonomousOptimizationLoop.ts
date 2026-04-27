import "server-only";

import { writeMarketplaceEvent as trackEvent } from "@/lib/analytics/tracker";
import { flags } from "@/lib/flags";
import { loadBrainOptimizationActions, loadSearchDemandActions } from "@/lib/growth/autonomousOptimizationInputs";
import { insertLecipmAutonomousOptimizationRun } from "@/lib/growth/autonomousOptimizationPersistence";

const PRIO = { high: 0, medium: 1, low: 2 } as const;

export type AutonomousOptimizationAction = {
  id: string;
  area: string;
  priority: "low" | "medium" | "high";
  safeToAutomate: boolean;
  title: string;
  detail?: string;
};

export type AutonomousOptimizationInputProvider = () => Promise<AutonomousOptimizationAction[]>;

export function sortActionsByPriority(actions: AutonomousOptimizationAction[]): AutonomousOptimizationAction[] {
  return [...actions].sort((a, b) => PRIO[a.priority] - PRIO[b.priority]);
}

function dedupeById(actions: AutonomousOptimizationAction[]): AutonomousOptimizationAction[] {
  const seen = new Set<string>();
  const out: AutonomousOptimizationAction[] = [];
  for (const a of actions) {
    if (seen.has(a.id)) continue;
    seen.add(a.id);
    out.push(a);
  }
  return out;
}

const DEFAULT_PROVIDERS: AutonomousOptimizationInputProvider[] = [
  loadBrainOptimizationActions,
  loadSearchDemandActions,
];

/**
 * LECIPM daily autonomous optimization loop: collect signals, merge actions, sort by priority,
 * emit `trackEvent` (via `writeMarketplaceEvent`), persist an audit row.
 * Does **not** change prices, bookings, refunds, messages, or compliance state.
 */
export async function runAutonomousOptimizationLoop(args?: {
  dryRun?: boolean;
  /** @default "api" for interactive runs */
  trigger?: string;
  /** Override inputs (e.g. tests). */
  inputProviders?: AutonomousOptimizationInputProvider[];
}): Promise<{
  ok: boolean;
  disabled?: boolean;
  runId: string | null;
  dryRun: boolean;
  actions: AutonomousOptimizationAction[];
  inputErrors: string[];
}> {
  if (!flags.AUTONOMOUS_OPTIMIZATION_LOOP) {
    return { ok: false, disabled: true, runId: null, dryRun: true, actions: [], inputErrors: [] };
  }

  const dryRun = args?.dryRun ?? true;
  const trigger = args?.trigger ?? "api";
  const providers = args?.inputProviders ?? DEFAULT_PROVIDERS;
  const inputErrors: string[] = [];
  const merged: AutonomousOptimizationAction[] = [];

  for (const p of providers) {
    try {
      const next = await p();
      merged.push(...next);
    } catch (e) {
      inputErrors.push(`${p.name || "input"}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const actions = sortActionsByPriority(dedupeById(merged));

  for (const a of actions) {
    void trackEvent("autonomous_optimization_action_generated", {
      area: a.area,
      priority: a.priority,
      safeToAutomate: a.safeToAutomate,
      actionId: a.id,
    }).catch(() => {});
  }

  const row = await insertLecipmAutonomousOptimizationRun({
    dryRun,
    trigger,
    actions,
    summary: { inputErrors, actionCount: actions.length },
  });

  void trackEvent("autonomous_optimization_run", {
    runId: row.id,
    dryRun,
    actionCount: actions.length,
    trigger,
  }).catch(() => {});

  return { ok: true, runId: row.id, dryRun, actions, inputErrors };
}
