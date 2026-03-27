import type { ContractWithRelations } from "@/modules/contracts/services/access";

const LEGAL =
  "Electronic signatures are legally binding subject to applicable law. This document is not professional tax or legal advice.";

export function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function contractToPdfPayload(c: ContractWithRelations): {
  title: string;
  reference: string;
  htmlExcerpt: string;
  signatures: { role: string; name: string; email: string; signedAt: string | null; ip: string | null }[];
  legalNotice: string;
} {
  const rawText = (c as { contentText?: string | null }).contentText?.trim() ?? "";
  return {
    title: c.title || "Contract",
    reference: c.id.slice(0, 12).toUpperCase(),
    htmlExcerpt: (rawText ? rawText : stripHtml(c.contentHtml ?? "")).slice(0, 12000),
    signatures: c.signatures.map((s) => ({
      role: s.role,
      name: s.name,
      email: s.email,
      signedAt: s.signedAt?.toISOString() ?? null,
      ip: s.ipAddress,
    })),
    legalNotice: LEGAL,
  };
}
