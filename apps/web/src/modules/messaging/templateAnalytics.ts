import { prisma } from "@/lib/db";

export type TemplatePerformanceMetrics = {
  templateKey: string;
  sent: number;
  /** AI rows where some later user message exists in the same thread (proxy for “got a reply”). */
  replyAfter: number;
  /** Distinct conversations with funnel outcome booked that used this template at least once. */
  conversionBooked: number;
};

/**
 * Step 11 analytics: per `templateKey` on AI messages — sent, reply-after, booked conversions.
 * Uses SQL for efficient attribution; falls back to empty on unexpected DB errors.
 */
export async function getTemplatePerformanceMetrics(): Promise<TemplatePerformanceMetrics[]> {
  try {
    const sentRows = await prisma.$queryRaw<{ template_key: string; sent: bigint; reply_after: bigint }[]>`
      SELECT
        m.template_key AS template_key,
        COUNT(*)::bigint AS sent,
        COUNT(*) FILTER (WHERE EXISTS (
          SELECT 1 FROM growth_ai_conversation_messages u
          WHERE u.conversation_id = m.conversation_id
            AND u.sender_type = 'user'
            AND u.created_at > m.created_at
        ))::bigint AS reply_after
      FROM growth_ai_conversation_messages m
      WHERE m.sender_type = 'ai' AND m.template_key IS NOT NULL
      GROUP BY m.template_key
      ORDER BY COUNT(*) DESC
    `;

    const convRows = await prisma.$queryRaw<{ template_key: string; booked: bigint }[]>`
      SELECT
        m.template_key AS template_key,
        COUNT(DISTINCT m.conversation_id)::bigint AS booked
      FROM growth_ai_conversation_messages m
      INNER JOIN growth_ai_conversations c ON c.id = m.conversation_id
      WHERE m.sender_type = 'ai'
        AND m.template_key IS NOT NULL
        AND c.outcome = 'booked'
      GROUP BY m.template_key
    `;

    const bookedByKey = new Map(convRows.map((r) => [r.template_key, Number(r.booked)]));

    return sentRows.map((r) => ({
      templateKey: r.template_key,
      sent: Number(r.sent),
      replyAfter: Number(r.reply_after),
      conversionBooked: bookedByKey.get(r.template_key) ?? 0,
    }));
  } catch {
    return [];
  }
}
