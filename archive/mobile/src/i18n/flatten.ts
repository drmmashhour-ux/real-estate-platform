export type MessageTree = Record<string, unknown>;

export function flattenMessageTree(input: MessageTree, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(input)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") {
      out[key] = v;
    } else if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenMessageTree(v as MessageTree, key));
    }
  }
  return out;
}
