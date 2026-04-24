import type { DreamHomeQuestionnaireInput, DreamHomeProfile } from "@/modules/dream-home/types/dream-home.types";
import { toBudgetBand, toFamilySizeBand } from "@/modules/dream-home/utils/dream-home-normalize";
import {
  createSnapshot,
  ensureUserPreferenceProfile,
  getProfile,
  rebuildProfile,
} from "../services/user-preference-profile.service";
import { recordSignal } from "../services/user-preference-signal.service";
import { updateJourneyState } from "../services/user-journey.service";
import { playbookLog } from "@/modules/playbook-memory/playbook-memory.logger";

/**
 * Pre-fills questionnaire from stored profile; **incoming `body` wins** (explicit session).
 */
export async function mergeStoredPreferencesIntoIntake(
  userId: string | null,
  body: unknown,
): Promise<unknown> {
  if (!userId || !body || typeof body !== "object" || Array.isArray(body)) {
    return body;
  }
  const p = await getProfile(userId);
  if (!p.ok || !p.data) {
    return body;
  }
  const h = p.data.categories.housing;
  if (!h || typeof h !== "object") {
    return body;
  }
  const fromStored: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(h as Record<string, unknown>)) {
    const k2 = k.replace(/^dream_home_/, "");
    if (k2 === "location_city" && typeof v === "string") {
      fromStored.city = v;
    }
    if (k2 === "budget_band" && typeof v === "string") {
      /* don't override numeric budget; band is hint only */
    }
    if (k2 === "hosting_level" && (v === "low" || v === "medium" || v === "high")) {
      fromStored.guestsFrequency = v;
    }
    if (k2 === "privacy_level" && (v === "low" || v === "medium" || v === "high")) {
      fromStored.privacyPreference = v;
    }
    if (k2 === "work_from_home_level" && (v === "none" || v === "sometimes" || v === "full_time")) {
      fromStored.workFromHome = v;
    }
    if (k2 === "style_preference" && Array.isArray(v)) {
      fromStored.stylePreferences = v;
    }
  }
  return { ...fromStored, ...(body as object) };
}

function mapQToSignals(q: DreamHomeQuestionnaireInput) {
  const out: { key: string; value: unknown }[] = [];
  if (q.familySize != null) {
    out.push({ key: "family_size_band", value: toFamilySizeBand(q.familySize) });
  }
  if (q.guestsFrequency) {
    out.push({ key: "hosting_level", value: q.guestsFrequency });
  }
  if (q.privacyPreference) {
    out.push({ key: "privacy_level", value: q.privacyPreference });
  }
  if (q.kitchenPriority) {
    out.push({ key: "kitchen_priority", value: q.kitchenPriority });
  }
  if (q.outdoorPriority) {
    out.push({ key: "outdoor_priority", value: q.outdoorPriority });
  }
  if (q.workFromHome) {
    out.push({ key: "work_from_home_level", value: q.workFromHome });
  }
  if (q.stylePreferences?.length) {
    out.push({ key: "style_preference", value: q.stylePreferences });
  }
  if (q.city) {
    out.push({ key: "location_city", value: String(q.city).toLowerCase() });
  }
  if (q.budgetMin != null || q.budgetMax != null) {
    out.push({ key: "budget_band", value: toBudgetBand(q.budgetMin, q.budgetMax) });
  }
  if (q.accessibilityNeeds?.length) {
    out.push({ key: "accessibility_need", value: q.accessibilityNeeds });
  }
  if (q.lifestyleTags?.length) {
    out.push({ key: "lifestyle_tag", value: q.lifestyleTags });
  }
  if (q.neighborhoods?.length) {
    out.push({ key: "neigh_pref", value: q.neighborhoods });
  }
  if (q.transactionType) {
    out.push({ key: "housing_intent", value: q.transactionType });
  }
  return out;
}

/**
 * Best-effort: store explicit Dream Home answers; rebuild profile. Never throws.
 */
export async function recordDreamHomeQuestionnaire(
  userId: string,
  q: DreamHomeQuestionnaireInput,
  profile?: DreamHomeProfile,
): Promise<void> {
  try {
    const ens = await ensureUserPreferenceProfile(userId);
    if (!ens.ok) {
      return;
    }
    for (const { key, value } of mapQToSignals(q)) {
      const r = await recordSignal({
        userId,
        sourceDomain: "DREAM_HOME",
        sourceType: "dream_home_questionnaire",
        signalKey: `dream_home_${key}`,
        signalValue: value,
        explicitUserProvided: true,
        confidence: 0.95,
      });
      if (!r.ok) {
        playbookLog.warn("dream home signal skipped", { key, err: r.error });
      }
    }
    if (profile?.searchFilters) {
      const r = await recordSignal({
        userId,
        sourceDomain: "DREAM_HOME",
        sourceType: "dream_home_profile",
        signalKey: "dream_home_search_filters",
        signalValue: profile.searchFilters,
        explicitUserProvided: true,
        confidence: 0.9,
      });
      void r;
    }
    const rb = await rebuildProfile(userId, {
      userId,
      sessionExplicitOverride: (q as unknown as Record<string, unknown>) || null,
      trigger: "dream_home",
    });
    if (rb.ok) {
      await createSnapshot(userId, "system", "dream_home_session");
    }
    await updateJourneyState({
      userId,
      currentDomain: "DREAM_HOME",
      currentStage: "profile_built",
      currentIntent: q.transactionType ?? "buy",
      latestCity: q.city ?? null,
      latestHouseholdBand: toFamilySizeBand(q.familySize ?? 2),
      latestBudgetBand: toBudgetBand(q.budgetMin, q.budgetMax),
      latestPropertyIntent: q.transactionType,
      touchActivityAt: true,
    });
  } catch (e) {
    playbookLog.warn("recordDreamHomeQuestionnaire", { message: e instanceof Error ? e.message : String(e) });
  }
}
