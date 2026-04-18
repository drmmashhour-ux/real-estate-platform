/**
 * Fusion-local freeze only — does not toggle external flags or source engines.
 */
export type GlobalFusionFreezeState = {
  learningFrozen: boolean;
  influenceFrozen: boolean;
  reason: string | null;
  frozenAt: string | null;
};

let state: GlobalFusionFreezeState = {
  learningFrozen: false,
  influenceFrozen: false,
  reason: null,
  frozenAt: null,
};

export function getGlobalFusionFreezeState(): GlobalFusionFreezeState {
  return { ...state };
}

export function isFusionLearningFrozen(): boolean {
  return state.learningFrozen;
}

export function isFusionInfluenceFrozen(): boolean {
  return state.influenceFrozen;
}

export function applyGlobalFusionFreeze(input: {
  learning?: boolean;
  influence?: boolean;
  reason: string;
}): void {
  if (input.learning === true) state.learningFrozen = true;
  if (input.influence === true) state.influenceFrozen = true;
  state.reason = input.reason;
  state.frozenAt = new Date().toISOString();
}

export function clearGlobalFusionFreeze(opts?: { learning?: boolean; influence?: boolean }): void {
  if (opts?.learning === true) state.learningFrozen = false;
  if (opts?.influence === true) state.influenceFrozen = false;
  if (opts?.learning === true || opts?.influence === true) {
    if (!state.learningFrozen && !state.influenceFrozen) {
      state.reason = null;
      state.frozenAt = null;
    }
  }
  if (!opts) {
    state = {
      learningFrozen: false,
      influenceFrozen: false,
      reason: null,
      frozenAt: null,
    };
  }
}

/** Bounded recovery: clear freezes if metrics imply recovery (optional hook; conservative default clears nothing). */
export function maybeUnfreezeGlobalFusion(recoverySignal: boolean): void {
  if (recoverySignal) {
    clearGlobalFusionFreeze();
  }
}

export function clearGlobalFusionFreezeForTests(): void {
  state = {
    learningFrozen: false,
    influenceFrozen: false,
    reason: null,
    frozenAt: null,
  };
}
