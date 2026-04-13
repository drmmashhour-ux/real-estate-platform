import type { DealRequest } from "@prisma/client";

export function buildEmailDraftForRequest(req: Pick<DealRequest, "title" | "summary" | "targetRole" | "dueAt">): {
  subject: string;
  body: string;
} {
  const due = req.dueAt ? `Please respond by ${req.dueAt.toISOString().slice(0, 10)}.` : "";
  return {
    subject: `[Document request] ${req.title}`,
    body: `${req.summary ?? ""}\n\n${due}\n\n— Draft prepared in LECIPM (broker to review before sending).`,
  };
}
