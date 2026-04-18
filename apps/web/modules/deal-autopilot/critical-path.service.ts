/** Ordered assistive checklist — not a legal critical path. */
export const RESIDENTIAL_CRITICAL_PATH = [
  "Offer / PP filed in broker workflow",
  "Counter-proposals resolved",
  "Accepted offer — conditions listed",
  "Financing / inspection outcomes",
  "Deposit & trust evidence aligned",
  "Notary instructions & deed draft",
  "Closing & commission file",
] as const;

export function describeCriticalPathPosition(dealStatus: string): { stepIndex: number; note: string } {
  const s = dealStatus.toLowerCase();
  if (s === "closed") return { stepIndex: RESIDENTIAL_CRITICAL_PATH.length - 1, note: "Closed — post-close tasks only." };
  if (s.includes("closing")) return { stepIndex: 5, note: "Late-stage — notary/closing focus." };
  if (s.includes("financ") || s.includes("inspect")) return { stepIndex: 3, note: "Mid-stage — conditions." };
  if (s.includes("accepted")) return { stepIndex: 2, note: "Accepted — drive conditions." };
  if (s.includes("offer") || s.includes("counter")) return { stepIndex: 1, note: "Negotiation phase." };
  return { stepIndex: 0, note: "Early file — confirm mandate & draft PP." };
}
