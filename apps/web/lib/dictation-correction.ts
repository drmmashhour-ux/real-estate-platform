/**
 * Dictation correction — fix common speech-to-text / dictation errors.
 * Handles: duplicate words, spoken punctuation, sentence caps, and common typos.
 */

export interface CorrectionResult {
  corrected: string;
  changes: string[];
}

/** Words that are often duplicated by STT (case-insensitive). */
const DUPLICATE_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "to", "of", "in", "on", "at", "for", "with",
  "it", "its", "i", "you", "we", "they", "he", "she", "that", "this", "have", "has", "had", "will", "would",
  "can", "could", "be", "been", "being", "do", "does", "did", "if", "so", "as", "from", "by", "not", "no",
]);

/** Spoken punctuation (phrase -> character). */
const SPOKEN_PUNCTUATION: [RegExp, string][] = [
  [/\bcomma\b/gi, ","],
  [/\bperiod\b/gi, "."],
  [/\bquestion mark\b/gi, "?"],
  [/\bexclamation mark\b/gi, "!"],
  [/\bexclamation point\b/gi, "!"],
  [/\bnew line\b/gi, "\n"],
  [/\bnew paragraph\b/gi, "\n\n"],
  [/\bsemicolon\b/gi, ";"],
  [/\bcolon\b/gi, ":"],
  [/\bquote\b/gi, '"'],
  [/\bopen quote\b/gi, '"'],
  [/\bclose quote\b/gi, '"'],
  [/\bapostrophe\b/gi, "'"],
];

/** Common dictation typos (exact, case-insensitive) -> correction. */
const TYPOS: [string, string][] = [
  ["teh", "the"],
  ["adn", "and"],
  ["ta", "to"],
  ["waht", "what"],
  ["thier", "their"],
  ["recieve", "receive"],
  ["occured", "occurred"],
  ["accomodate", "accommodate"],
  ["seperate", "separate"],
  ["definately", "definitely"],
  ["buisness", "business"],
  ["proccess", "process"],
  ["enviroment", "environment"],
];

/**
 * Remove duplicate consecutive words (e.g. "the the house" -> "the house").
 */
function removeDuplicateWords(text: string, changes: string[]): string {
  const words = text.split(/(\s+)/);
  let out = "";
  let prevLower = "";
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (/\S/.test(w)) {
      const lower = w.toLowerCase().replace(/[^\w']/g, "");
      if (lower && lower === prevLower && DUPLICATE_WORDS.has(lower)) {
        changes.push(`Removed duplicate "${w.trim()}"`);
        continue;
      }
      prevLower = lower;
    } else {
      prevLower = "";
    }
    out += w;
  }
  return out;
}

/**
 * Replace spoken punctuation (e.g. "hello comma world" -> "hello, world").
 */
function replaceSpokenPunctuation(text: string, changes: string[]): string {
  let out = text;
  for (const [regex, replacement] of SPOKEN_PUNCTUATION) {
    const before = out;
    out = out.replace(regex, (match) => {
      changes.push(`Replaced "${match.trim()}" with "${replacement === "\n" ? "newline" : replacement}"`);
      return replacement;
    });
  }
  return out;
}

/**
 * Fix common typos (whole word, case-insensitive).
 */
function fixTypos(text: string, changes: string[]): string {
  let out = text;
  for (const [wrong, right] of TYPOS) {
    const regex = new RegExp(`\\b${wrong.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi");
    const before = out;
    out = out.replace(regex, () => {
      changes.push(`Corrected "${wrong}" → "${right}"`);
      return right;
    });
  }
  return out;
}

/**
 * Capitalize first letter after . ? !
 */
function capitalizeSentences(text: string, changes: string[]): string {
  return text.replace(/([.!?]\s+)([a-z])/g, (_, punct, letter) => {
    changes.push(`Capitalized after sentence end`);
    return punct + letter.toUpperCase();
  });
}

/**
 * Ensure the text ends with a sentence terminator if it looks like a sentence.
 */
function ensureSentenceEnd(text: string, changes: string[]): string {
  const trimmed = text.trimEnd();
  if (!trimmed) return text;
  const lastChar = trimmed.slice(-1);
  if (/[a-z0-9]/i.test(lastChar) && trimmed.length > 10) {
    changes.push("Added period at end");
    return trimmed + "." + (text.slice(trimmed.length));
  }
  return text;
}

/**
 * Trim and normalize spaces (multiple spaces -> single, trim each line).
 */
function normalizeSpaces(text: string, changes: string[]): string {
  let out = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n /g, "\n")
    .replace(/ \n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (out !== text) changes.push("Normalized spaces and line breaks");
  return out;
}

/**
 * Run all dictation correction rules on the given text.
 */
export function correctDictation(text: string): CorrectionResult {
  const changes: string[] = [];
  if (!text || typeof text !== "string") {
    return { corrected: "", changes: [] };
  }

  let result = text;
  result = normalizeSpaces(result, changes);
  result = replaceSpokenPunctuation(result, changes);
  result = fixTypos(result, changes);
  result = removeDuplicateWords(result, changes);
  result = capitalizeSentences(result, changes);
  result = ensureSentenceEnd(result, changes);
  result = normalizeSpaces(result, changes);

  return { corrected: result, changes };
}
