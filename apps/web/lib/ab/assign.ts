import { getExperiment } from "./experiments";

/**
 * 32-bit FNV-1a–style mix so assignment is stable across runtimes (not `object-hash`).
 */
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic bucket: same (subject, experiment) always maps to the same variant.
 * Uses the experiment’s `variants` list order (any length).
 */
export function assignVariant(userId: string, experimentId: string): string {
  const exp = getExperiment(experimentId);
  const variants = exp?.variants?.length ? exp.variants : ["A", "B"];
  const idx = hash32(`${userId}\0${experimentId}`) % variants.length;
  return variants[idx] ?? "A";
}
