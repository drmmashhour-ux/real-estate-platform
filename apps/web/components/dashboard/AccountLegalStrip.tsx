import { prisma } from "@/lib/db";
import { LEGAL_DOCUMENT_TYPES } from "@/lib/legal/constants";

/**
 * Light visibility: shows agreement status without blocking flows (demo-friendly).
 */
export async function AccountLegalStrip({ userId }: { userId: string }) {
  const [content, intermediary] = await Promise.all([
    prisma.contentLicenseAcceptance.findUnique({ where: { userId } }),
    prisma.userAgreement.findFirst({
      where: { userId, documentType: LEGAL_DOCUMENT_TYPES.PLATFORM_INTERMEDIARY_DISCLOSURE },
    }),
  ]);

  const hasAgreement = Boolean(content || intermediary);
  const when = content?.acceptedAt ?? intermediary?.acceptedAt;

  return (
    <div className="border-b border-white/10 bg-[#0B0B0B]/90 px-4 py-2 text-center text-[11px] text-slate-500">
      {hasAgreement ? (
        <span className="text-emerald-400/95">
          Agreement on file
          {when ? (
            <span className="text-slate-500"> · {when.toLocaleDateString("en-CA", { dateStyle: "medium" })}</span>
          ) : null}
        </span>
      ) : (
        <span>
          Optional: review platform agreements on the{" "}
          <a href="/legal" className="text-premium-gold underline hover:text-premium-gold">
            Legal
          </a>{" "}
          page when convenient.
        </span>
      )}
    </div>
  );
}
