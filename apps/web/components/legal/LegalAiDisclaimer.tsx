import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";

export function LegalAiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-snug text-amber-200/85 ${className}`} role="note">
      {AI_LEGAL_DISCLAIMER}
    </p>
  );
}
