import type { ConversationThreadView } from "@/modules/messaging/conversation.model";

export type RecentLine = {
  role: "broker" | "client" | "system";
  text: string;
};

export type BrokerReplyContext = {
  listingTitle?: string;
  city?: string;
  subject?: string | null;
  lines: RecentLine[];
};

export function trimRecentLines(lines: RecentLine[], max = 24): RecentLine[] {
  if (lines.length <= max) return lines;
  return lines.slice(lines.length - max);
}

/** Build prompt context from CRM-style thread metadata + transcript. */
export function buildBrokerReplyContext(
  detail: Pick<ConversationThreadView, "subject" | "context">,
  transcript: RecentLine[]
): BrokerReplyContext {
  const listing = detail.context.listing;
  return {
    subject: detail.subject,
    listingTitle: listing?.title,
    city: undefined,
    lines: trimRecentLines(transcript),
  };
}

export function formatContextForPrompt(ctx: BrokerReplyContext): string {
  const bits: string[] = [];
  if (ctx.subject?.trim()) bits.push(`Thread subject: ${ctx.subject.trim()}`);
  if (ctx.listingTitle?.trim()) bits.push(`Listing: ${ctx.listingTitle.trim()}`);
  if (ctx.city?.trim()) bits.push(`City: ${ctx.city.trim()}`);
  bits.push("Recent messages (oldest first):");
  for (const line of ctx.lines) {
    bits.push(`- [${line.role}] ${line.text.replace(/\s+/g, " ").trim()}`);
  }
  return bits.join("\n");
}
