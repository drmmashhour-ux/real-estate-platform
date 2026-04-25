/**
 * Copy-paste reference — not routed in production.
 *
 * UI: import { LegalNoticeCard } from "@/components/legal/LegalNoticeCard"
 * Contracts / PDF: import { formatLegalNoticesHtmlDocumentSection, formatLegalNoticesPlainDocumentSection } from "@/modules/legal-notices/legalNoticeInjection"
 */
"use client";

import { useState } from "react";
import { LegalNoticeCard } from "@/components/legal/LegalNoticeCard";
import {
  formatLegalNoticesHtmlDocumentSection,
  formatLegalNoticesPlainDocumentSection,
} from "@/modules/legal-notices/legalNoticeInjection";

export function LegalNoticeUsageExample() {
  const [ackPrivacy, setAckPrivacy] = useState(false);
  const [recAi, setRecAi] = useState(false);

  const pdfHtml = formatLegalNoticesHtmlDocumentSection(["AI_NOTICE", "PRIVACY_NOTICE"], "fr", "pdf_export");
  const plain = formatLegalNoticesPlainDocumentSection(["REFERRAL_NOTICE"], "en");

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 text-left">
      <LegalNoticeCard
        noticeKey="AI_NOTICE"
        locale="fr"
        recommendedAcknowledged={recAi}
        onRecommendedAcknowledgedChange={setRecAi}
      />
      <LegalNoticeCard
        noticeKey="PRIVACY_NOTICE"
        locale="fr"
        acknowledged={ackPrivacy}
        onAcknowledgedChange={setAckPrivacy}
      />
      <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2 text-[10px] text-slate-400">{plain}</pre>
      <pre className="max-h-40 overflow-auto rounded-lg bg-slate-900 p-2 text-[10px] text-slate-400">{pdfHtml.slice(0, 500)}…</pre>
    </div>
  );
}
