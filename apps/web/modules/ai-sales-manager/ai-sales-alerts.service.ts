import type { SalesAlert, SalesProfile } from "./ai-sales-manager.types";
import { loadAiSalesStore, saveAiSalesStore, uid } from "./ai-sales-manager-storage";
import { analyzeCoachingSignals } from "./ai-sales-coaching.service";

const DEDUPE_WINDOW = 12 * 60 * 60 * 1000;

function recentDuplicate(key: string): boolean {
  const store = loadAiSalesStore();
  const now = Date.now();
  return store.alertHistory.some(
    (a) => a.dedupeKey === key && now - new Date(a.createdAtIso).getTime() < DEDUPE_WINDOW,
  );
}

function pushAlert(alert: SalesAlert): void {
  const store = loadAiSalesStore();
  store.alertHistory.push(alert);
  if (store.alertHistory.length > 200) store.alertHistory = store.alertHistory.slice(-200);
  saveAiSalesStore(store);
}

/**
 * Manager notifications — rules are explicit, not learned black-box.
 */
export function evaluateAlertsForUser(profile: SalesProfile): SalesAlert[] {
  const out: SalesAlert[] = [];
  const h = profile.scoreHistory;

  if (h.length >= 6) {
    const prev = h.slice(-6, -3);
    const recent = h.slice(-3);
    const pa = prev.reduce((s, x) => s + x, 0) / prev.length;
    const ra = recent.reduce((s, x) => s + x, 0) / recent.length;
    if (pa - ra > 8 && !recentDuplicate(`drop:${profile.userId}`)) {
      const al: SalesAlert = {
        alertId: uid(),
        userId: profile.userId,
        kind: "performance_drop",
        severity: "warn",
        title: "Rolling score dip",
        body: `Trailing 3-score average (~${Math.round(ra)}) fell vs prior window (~${Math.round(pa)}). Consider coaching touchpoint.`,
        triggers: [
          { label: "priorAvg", value: Math.round(pa) },
          { label: "recentAvg", value: Math.round(ra) },
        ],
        createdAtIso: new Date().toISOString(),
        dedupeKey: `drop:${profile.userId}`,
      };
      pushAlert(al);
      out.push(al);
    }
  }

  const topObj = profile.mostCommonObjections[0];
  if (topObj && (profile.objectionCounts[topObj] ?? 0) >= 4 && !recentDuplicate(`obj:${profile.userId}:${topObj}`)) {
    const al: SalesAlert = {
      alertId: uid(),
      userId: profile.userId,
      kind: "objection_spike",
      severity: "warn",
      title: "Repeated objection failure theme",
      body: `Pattern on "${topObj.slice(0, 64)}…" observed ${profile.objectionCounts[topObj]}× — drill + script tweak.`,
      triggers: [{ label: "count", value: profile.objectionCounts[topObj] ?? 0 }],
      createdAtIso: new Date().toISOString(),
      dedupeKey: `obj:${profile.userId}:${topObj}`,
    };
    pushAlert(al);
    out.push(al);
  }

  if (profile.improvementTrend === "up" && profile.trainingSessionCount >= 5 && !recentDuplicate(`rapid:${profile.userId}`)) {
    const al: SalesAlert = {
      alertId: uid(),
      userId: profile.userId,
      kind: "rapid_improvement",
      severity: "positive",
      title: "Strong improvement trajectory",
      body: "Rolling scores trending up — candidate for harder scenarios or live stretch goals.",
      triggers: [{ label: "trend", value: profile.improvementTrend }],
      createdAtIso: new Date().toISOString(),
      dedupeKey: `rapid:${profile.userId}`,
    };
    pushAlert(al);
    out.push(al);
  }

  if (
    profile.averageTrainingScore >= 78 &&
    profile.trainingSessionCount >= 8 &&
    !recentDuplicate(`harder:${profile.userId}`)
  ) {
    const al: SalesAlert = {
      alertId: uid(),
      userId: profile.userId,
      kind: "ready_harder_scenarios",
      severity: "info",
      title: "Ready for harder simulations",
      body: "Training averages stable in high band — rotate EXTREME / multi-objection stacks.",
      triggers: [{ label: "averageTrainingScore", value: Math.round(profile.averageTrainingScore) }],
      createdAtIso: new Date().toISOString(),
      dedupeKey: `harder:${profile.userId}`,
    };
    pushAlert(al);
    out.push(al);
  }

  const denom = profile.closesWon + profile.closesLost;
  if (denom >= 8) {
    const wr = profile.closesWon / denom;
    const key = `close:${profile.userId}:${Math.round(wr * 100)}`;
    if ((wr < 0.12 || wr > 0.42) && !recentDuplicate(key)) {
      const al: SalesAlert = {
        alertId: uid(),
        userId: profile.userId,
        kind: "close_rate_threshold",
        severity: wr < 0.12 ? "warn" : "info",
        title: wr < 0.12 ? "Close rate below threshold" : "Close rate breakout",
        body: `Tracked win rate ~${Math.round(wr * 100)}% across ${denom} outcomes — ${wr < 0.12 ? "inspect qualification" : "capture playbook"}.`,
        triggers: [{ label: "winRate", value: wr.toFixed(2) }],
        createdAtIso: new Date().toISOString(),
        dedupeKey: key,
      };
      pushAlert(al);
      out.push(al);
    }
  }

  const coaching = analyzeCoachingSignals(profile);
  if (coaching.weaknesses.length >= 4 && !recentDuplicate(`coach:${profile.userId}`)) {
    const al: SalesAlert = {
      alertId: uid(),
      userId: profile.userId,
      kind: "coaching_opportunity",
      severity: "warn",
      title: "Multiple coaching gaps open",
      body: "Several weakness signals fired — schedule focused coaching or assign scenarios.",
      triggers: coaching.weaknesses.slice(0, 3).map((w, i) => ({ label: `weakness_${i}`, value: w.slice(0, 80) })),
      createdAtIso: new Date().toISOString(),
      dedupeKey: `coach:${profile.userId}`,
    };
    pushAlert(al);
    out.push(al);
  }

  return out;
}

export function listRecentAlerts(limit = 40): SalesAlert[] {
  return [...loadAiSalesStore().alertHistory]
    .sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso))
    .slice(0, limit);
}
