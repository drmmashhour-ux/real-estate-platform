/**
 * Lightweight text diff for broker-facing version comparison (not a legal redline engine).
 */
export type TextDiffLine = { kind: "same" | "add" | "remove"; text: string };

export function computeLineDiff(before: string, after: string): TextDiffLine[] {
  const a = before.split("\n");
  const b = after.split("\n");
  const out: TextDiffLine[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i += 1) {
    const la = a[i];
    const lb = b[i];
    if (la === lb && la !== undefined) {
      out.push({ kind: "same", text: la });
    } else {
      if (la !== undefined && la !== lb) out.push({ kind: "remove", text: la });
      if (lb !== undefined && la !== lb) out.push({ kind: "add", text: lb });
    }
  }
  return out;
}

export function summarizeDiff(lines: TextDiffLine[]): { added: number; removed: number } {
  return {
    added: lines.filter((l) => l.kind === "add").length,
    removed: lines.filter((l) => l.kind === "remove").length,
  };
}
