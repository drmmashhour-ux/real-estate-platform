/** Hook generator patterns — first line must be strong; combined with platform tone. */
export const HOOK_PATTERNS = ["mistake", "loss", "curiosity", "comparison", "outcome"] as const;
export type HookPattern = (typeof HOOK_PATTERNS)[number];

export function isHookPattern(s: string): s is HookPattern {
  return (HOOK_PATTERNS as readonly string[]).includes(s);
}

export function hookPatternForSlotIndex(index: number): HookPattern {
  return HOOK_PATTERNS[index % HOOK_PATTERNS.length]!;
}
