import "server-only";

/** Deterministic pseudo-embedding stub (no upstream vector DB). */
export async function embedText(text: string): Promise<number[]> {
  const dim = Math.min(32, Math.max(4, Math.floor(text.trim().length / 4)));
  const out: number[] = [];
  for (let i = 0; i < dim; i += 1) {
    const v = Math.sin((text.charCodeAt(i % text.length) || 32) / 127 + i) * 0.01;
    out.push(Number.isFinite(v) ? v : 0);
  }
  return out.length ? out : [0, 0, 0];
}
