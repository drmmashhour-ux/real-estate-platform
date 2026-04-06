import type { GenerationFeedbackInput } from "./types";

/** Appends light performance context to model prompts (no over-engineering). */
export function feedbackPromptBlock(f?: GenerationFeedbackInput): string {
  if (!f) return "";
  const bits: string[] = [];
  if (f.pastPerformance?.trim()) {
    bits.push(`Past performance / team notes: ${f.pastPerformance.trim()}`);
  }
  if (f.bestThemes?.length) {
    bits.push(`Best-performing content themes to lean on: ${f.bestThemes.join(", ")}`);
  }
  if (f.channelNotes?.trim()) {
    bits.push(`Channel-specific notes: ${f.channelNotes.trim()}`);
  }
  if (f.priorHighPerformingExamples?.trim()) {
    bits.push(`Prior high-performing examples / patterns (do not copy verbatim if branded): ${f.priorHighPerformingExamples.trim()}`);
  }
  if (!bits.length) return "";
  return `\n\n---\n${bits.join("\n")}\n---\n`;
}
