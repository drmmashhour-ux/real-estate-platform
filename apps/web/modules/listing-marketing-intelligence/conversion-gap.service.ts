export function detectConversionGaps(input: { views: number; inquiries: number }): string[] {
  const out: string[] = [];
  if (input.views > 40 && input.inquiries < 2) {
    out.push("Views are not converting to inquiries — review contact clarity, description completeness, and call-to-action.");
  }
  return out;
}
