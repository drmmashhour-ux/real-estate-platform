export function inferLeadIntentLabel(lead: { leadType?: string | null; message?: string | null }): string {
  const m = `${lead.leadType ?? ""} ${lead.message ?? ""}`.toLowerCase();
  if (/\b(invest|roi|cap rate|multiplex|plex|rendement)\b/.test(m)) return "invest";
  if (/\b(rent|lease|locat|louer)\b/.test(m)) return "rent";
  if (/\b(buy|purchase|achet|acheter)\b/.test(m)) return "buy";
  return "other";
}
