function hashWord(w: string) {
  let h = 0;
  for (let i = 0; i < w.length; i += 1) h = (h * 31 + w.charCodeAt(i)) % 1000003;
  return h;
}

export function toDeterministicEmbedding(text: string, dims = 32): number[] {
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return vec;
  for (const word of words) {
    const h = hashWord(word);
    vec[h % dims] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => Number((v / norm).toFixed(6)));
}

export function cosineSimilarity(a: number[], b: number[]) {
  const len = Math.min(a.length, b.length);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < len; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb) || 1;
  return dot / denom;
}
