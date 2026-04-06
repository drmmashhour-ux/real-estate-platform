/**
 * Flattens nested locale JSON into dot-path keys for `t("common.save")`-style lookups.
 * Only string leaves are included; non-plain objects are skipped.
 */
export type MessageTree = Record<string, unknown>;

export type FlatMessageDict = Record<string, string>;

export function flattenMessageTree(input: MessageTree, prefix = ""): FlatMessageDict {
  const out: FlatMessageDict = {};
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

/** Deep-merge string leaves from `defaults` with `override` (override wins). */
export function mergeMessageTrees(defaults: MessageTree, override: MessageTree): MessageTree {
  const out: MessageTree = { ...defaults };
  for (const [k, v] of Object.entries(override)) {
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      const base = defaults[k];
      out[k] =
        base !== null && typeof base === "object" && !Array.isArray(base)
          ? mergeMessageTrees(base as MessageTree, v as MessageTree)
          : { ...(v as MessageTree) };
    } else {
      out[k] = v;
    }
  }
  return out;
}
