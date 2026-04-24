import { CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER } from "@/lib/legal/contract-brain-html";

export type ProtectedSpan = { start: number; end: number; content: string };

export function extractProtectedSpans(text: string): ProtectedSpan[] {
  const spans: ProtectedSpan[] = [];
  let idx = 0;
  while (idx < text.length) {
    const brain = text.indexOf(CONTRACT_BRAIN_LIMITED_ROLE_HTML_MARKER, idx);
    if (brain === -1) break;
    const endSection = text.indexOf("</section>", brain);
    const end = endSection === -1 ? text.length : endSection + "</section>".length;
    spans.push({ start: brain, end, content: text.slice(brain, end) });
    idx = end;
  }
  return spans;
}

export function stripProtectedForRewrite(text: string): { stripped: string; spans: ProtectedSpan[] } {
  const spans = extractProtectedSpans(text);
  if (!spans.length) return { stripped: text, spans: [] };
  let out = text;
  for (let i = spans.length - 1; i >= 0; i--) {
    const s = spans[i];
    out = out.slice(0, s.start) + `__PROTECTED_${i}__` + out.slice(s.end);
  }
  return { stripped: out, spans };
}

export function restoreProtected(text: string, spans: ProtectedSpan[]): string {
  let out = text;
  for (let i = 0; i < spans.length; i++) {
    out = out.split(`__PROTECTED_${i}__`).join(spans[i].content);
  }
  return out;
}
