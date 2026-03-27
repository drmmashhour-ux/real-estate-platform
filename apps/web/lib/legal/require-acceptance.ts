import { redirect } from "next/navigation";
import { hasAcceptedRequired, BNHUB_HOST_AGREEMENT_ROUTE, ACCEPTANCE_ROUTE } from "./acceptance";
import { getApprovedHost } from "@/lib/bnhub/host";
import { hasAcceptedHostAgreement } from "@/lib/bnhub/host";

/**
 * Call in server components/layouts. Redirects to acceptance page if user has not accepted required platform docs (Terms + Privacy).
 * Safe: if DB fails or no docs configured, does not redirect (allows app to run).
 */
export async function requirePlatformAcceptance(userId: string | null): Promise<void> {
  if (!userId) return;
  try {
    const ok = await hasAcceptedRequired(userId, "platform");
    if (!ok) redirect(ACCEPTANCE_ROUTE);
  } catch (e) {
    console.warn("[legal] requirePlatformAcceptance check failed:", e);
  }
}

/**
 * Call before allowing host dashboard / listing creation. Redirects to host agreement if not accepted.
 * Safe: if DB fails, does not redirect.
 */
export async function requireBnhubHostAgreement(userId: string | null): Promise<void> {
  if (!userId) return;
  try {
    const host = await getApprovedHost(userId);
    if (!host) return;
    const accepted = await hasAcceptedHostAgreement(host.id);
    if (!accepted) redirect(BNHUB_HOST_AGREEMENT_ROUTE);
  } catch (e) {
    console.warn("[legal] requireBnhubHostAgreement check failed:", e);
  }
}
