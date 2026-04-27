import { dateFromYmd } from "@/lib/pricing/calculateTotal";

/**
 * New end YMD that preserves the same millisecond span as the original (start, end) stay.
 */
export function endYmdForSameSpan(requestStartYmd: string, requestEndYmd: string, newStartYmd: string): string {
  const a = requestStartYmd.slice(0, 10);
  const b = requestEndYmd.slice(0, 10);
  const c = newStartYmd.slice(0, 10);
  const off = dateFromYmd(b).getTime() - dateFromYmd(a).getTime();
  if (off < 0) return c;
  return new Date(dateFromYmd(c).getTime() + off).toISOString().slice(0, 10);
}
