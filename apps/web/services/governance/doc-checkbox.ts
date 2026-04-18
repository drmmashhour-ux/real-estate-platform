/**
 * Read markdown checkbox completion from repo files (observational; not an audit).
 */
import fs from "fs";

/** Count `- [x]` / `- [ ]` lines in a section starting at `heading` until the next `##` heading. */
export function parseSectionCheckboxStats(
  content: string,
  sectionHeading: string,
): { checked: number; unchecked: number } {
  const lines = content.split(/\r?\n/);
  let i = lines.findIndex((l) => l.trim().startsWith(sectionHeading));
  if (i < 0) return { checked: 0, unchecked: 0 };
  let checked = 0;
  let unchecked = 0;
  for (let j = i + 1; j < lines.length; j++) {
    const line = lines[j];
    if (/^##\s/.test(line.trim()) && !line.trim().startsWith(sectionHeading)) break;
    if (/^\s*-\s*\[x\]/i.test(line)) checked++;
    else if (/^\s*-\s*\[\s*\]/.test(line)) unchecked++;
  }
  return { checked, unchecked };
}

export function parseWholeDocCheckboxStats(content: string): { checked: number; unchecked: number } {
  let checked = 0;
  let unchecked = 0;
  for (const line of content.split(/\r?\n/)) {
    if (/^\s*-\s*\[x\]/i.test(line)) checked++;
    else if (/^\s*-\s*\[\s*\]/.test(line)) unchecked++;
  }
  return { checked, unchecked };
}

export function readFileSafe(absPath: string): string | null {
  try {
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}

export function fileExists(absPath: string): boolean {
  try {
    return fs.statSync(absPath).isFile();
  } catch {
    return false;
  }
}

/** Section reviewed if majority of boxes in section are checked (or section empty). */
export function sectionMostlyComplete(content: string, heading: string, minRatio = 0.5): boolean {
  const { checked, unchecked } = parseSectionCheckboxStats(content, heading);
  const t = checked + unchecked;
  if (t === 0) return false;
  return checked / t >= minRatio;
}

/** Raw lines from first `heading` until next `##` (exclusive). */
export function extractMarkdownSection(content: string, heading: string): string {
  const lines = content.split(/\r?\n/);
  const start = lines.findIndex((l) => l.trim() === heading.trim());
  if (start < 0) return "";
  const out: string[] = [];
  for (let j = start + 1; j < lines.length; j++) {
    const line = lines[j];
    if (/^##\s/.test(line.trim())) break;
    out.push(line);
  }
  return out.join("\n");
}

/** Checkbox lines in a section mentioning a keyword (case-insensitive). */
export function keywordCheckboxLinesComplete(content: string, sectionHeading: string, keyword: RegExp): boolean {
  const block = extractMarkdownSection(content, sectionHeading);
  const lines = block.split("\n").filter((l) => keyword.test(l) && /-\s*\[/.test(l));
  if (lines.length === 0) return false;
  return lines.every((l) => /\[x\]/i.test(l));
}
