import type { IdDocumentType } from "@/lib/fsbo/seller-declaration-schema";

/**
 * Québec driver's licence numbers are often structured as:
 * one letter, four digits, then an embedded date (month, day, last two digits of birth year), then two digits.
 * User-facing input may include spaces or hyphens (e.g. L1531-171274-08).
 *
 * We compare the embedded date to the listed date of birth when both are present.
 * If the strict MMDDYY segment does not match, we try DDMMYY for the same six digits (common on Québec cards).
 */

const QC_DL_PATTERN = /^([A-Z])(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/;

function normalizePermisInput(raw: string): string {
  return raw.replace(/[\s\-.]/g, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function validCalendarMonthDay(mm: number, dd: number): boolean {
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
  return true;
}

export type QuebecDlDobCheckResult =
  | { show: false }
  | { show: true; variant: "info"; message: string }
  | { show: true; variant: "match"; message: string }
  | { show: true; variant: "mismatch"; message: string };

/**
 * Returns UI state for Québec driver's licence vs listed date of birth (YYYY-MM-DD).
 */
export function checkQuebecDriverLicenseDob(
  idType: IdDocumentType | "",
  idNumberRaw: string,
  dateOfBirthYmd: string,
): QuebecDlDobCheckResult {
  if (idType !== "DRIVERS_LICENSE") {
    return { show: false };
  }

  const compact = normalizePermisInput(idNumberRaw);
  const m = compact.match(QC_DL_PATTERN);
  if (!m) {
    if (!dateOfBirthYmd.trim()) {
      return {
        show: true,
        variant: "info",
        message:
          "Québec driver's licence: the number often embeds your birth date after the letter and first four digits (month, day, last two digits of birth year). Enter the full number and your date of birth to verify.",
      };
    }
    return {
      show: true,
      variant: "info",
      message:
        "If this is a Québec licence, enter the full number (with or without hyphens). We will check that the date embedded in the number matches your date of birth below.",
    };
  }

  const mm = parseInt(m[3], 10);
  const dd = parseInt(m[4], 10);
  const yy2 = parseInt(m[5], 10);

  const mmdd = { mm, dd, yy2, order: "MMDDYY" as const };
  const ddmm = { mm: dd, dd: mm, yy2, order: "DDMMYY" as const };

  const parts = dateOfBirthYmd.trim().split("-");
  if (parts.length !== 3) {
    return {
      show: true,
      variant: "info",
      message:
        "Set your date of birth below to confirm the date embedded in this Québec licence number (month, day, last two digits of birth year).",
    };
  }

  const yListed = parseInt(parts[0], 10);
  const moListed = parseInt(parts[1], 10);
  const dListed = parseInt(parts[2], 10);
  if (!Number.isFinite(yListed) || !Number.isFinite(moListed) || !Number.isFinite(dListed)) {
    return { show: true, variant: "info", message: "Enter a valid date of birth to compare with the licence number." };
  }

  const yyListed = yListed % 100;

  function matches(segment: { mm: number; dd: number; yy2: number; order: string }): boolean {
    if (!validCalendarMonthDay(segment.mm, segment.dd)) return false;
    return segment.mm === moListed && segment.dd === dListed && segment.yy2 === yyListed;
  }

  if (matches(mmdd)) {
    return {
      show: true,
      variant: "match",
      message: "The date embedded in this licence number (month–day–year of birth) matches your listed date of birth.",
    };
  }
  if (matches({ ...ddmm })) {
    return {
      show: true,
      variant: "match",
      message:
        "The date embedded in this licence number matches your listed date of birth (day/month order as encoded on the licence).",
    };
  }

  const embeddedHint = validCalendarMonthDay(mm, dd)
    ? `${String(mm).padStart(2, "0")}/${String(dd).padStart(2, "0")}/${String(yy2).padStart(2, "0")} (as MMDDYY in the number)`
    : "could not read a valid calendar date from the middle segment";

  return {
    show: true,
    variant: "mismatch",
    message: `The date embedded in the licence number (${embeddedHint}) does not match your listed date of birth (${dateOfBirthYmd}). Correct the licence number or your date of birth.`,
  };
}
