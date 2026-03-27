import {
  BnhubTrustIdentityProvider,
  BnhubTrustIdentitySessionStatus,
  BnhubTrustIdentityUserRole,
  BnhubTrustIdentityAuditActor,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { getIdentityProvider } from "@/modules/bnhub-trust/connectors/identityProviderFactory";
import { logIdentityAction } from "@/modules/bnhub-trust/services/trustDecisionAuditService";

function mapAdapterStatus(s: string): BnhubTrustIdentitySessionStatus {
  const m: Record<string, BnhubTrustIdentitySessionStatus> = {
    not_started: BnhubTrustIdentitySessionStatus.NOT_STARTED,
    pending: BnhubTrustIdentitySessionStatus.PENDING,
    requires_input: BnhubTrustIdentitySessionStatus.REQUIRES_INPUT,
    verified: BnhubTrustIdentitySessionStatus.VERIFIED,
    failed: BnhubTrustIdentitySessionStatus.FAILED,
    restricted: BnhubTrustIdentitySessionStatus.RESTRICTED,
  };
  return m[s] ?? BnhubTrustIdentitySessionStatus.PENDING;
}

export async function startIdentityVerification(params: {
  userId: string;
  userRole: BnhubTrustIdentityUserRole;
  returnUrl: string;
}) {
  const adapter = getIdentityProvider("stripe_identity");
  const res = await adapter.createVerificationSession({
    userId: params.userId,
    returnUrl: params.returnUrl,
    metadata: { userRole: params.userRole },
  });
  if ("error" in res) return { error: res.error };

  const row = await prisma.bnhubTrustIdentityVerification.create({
    data: {
      userId: params.userId,
      userRole: params.userRole,
      provider: BnhubTrustIdentityProvider.STRIPE_IDENTITY,
      verificationSessionId: res.sessionId,
      verificationStatus: BnhubTrustIdentitySessionStatus.PENDING,
      providerPayloadJson: { client_secret_set: Boolean(res.clientSecret) },
      resultSummary: adapter.getSafeSummary("pending"),
    },
  });
  await logIdentityAction({
    actorType: BnhubTrustIdentityAuditActor.HOST,
    actorId: params.userId,
    userId: params.userId,
    actionType: "verification_started",
    actionSummary: "Stripe Identity session created",
    after: { sessionId: res.sessionId },
  });
  return { id: row.id, sessionId: res.sessionId, clientSecret: res.clientSecret ?? null, url: res.url ?? null };
}

export async function refreshVerificationStatus(userId: string) {
  const latest = await prisma.bnhubTrustIdentityVerification.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!latest?.verificationSessionId) return null;
  const adapter = getIdentityProvider("stripe_identity");
  const st = await adapter.getVerificationStatus(latest.verificationSessionId);
  if ("error" in st) return null;
  const status = mapAdapterStatus(st.status);
  await prisma.bnhubTrustIdentityVerification.update({
    where: { id: latest.id },
    data: {
      verificationStatus: status,
      resultSummary: st.safeSummary,
      documentType: st.documentType ?? undefined,
      countryCode: st.countryCode ?? undefined,
      providerPayloadJson: (st.raw ?? {}) as object,
    },
  });
  await logIdentityAction({
    actorType: BnhubTrustIdentityAuditActor.SYSTEM,
    userId,
    actionType: "verification_refreshed",
    actionSummary: st.safeSummary,
    after: { status },
  });
  return status;
}

export async function getUserVerificationStatus(userId: string) {
  const row = await prisma.bnhubTrustIdentityVerification.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { verificationStatus: true, resultSummary: true, updatedAt: true },
  });
  return row;
}

export async function requireVerificationForHostPayouts(userId: string): Promise<boolean> {
  const s = await getUserVerificationStatus(userId);
  return s?.verificationStatus === BnhubTrustIdentitySessionStatus.VERIFIED;
}

export async function requireVerificationForPremiumServices(userId: string): Promise<boolean> {
  return requireVerificationForHostPayouts(userId);
}

export async function applyIdentityWebhookUpdate(sessionId: string, partial: { status?: string; safeSummary?: string }) {
  const row = await prisma.bnhubTrustIdentityVerification.findFirst({
    where: { verificationSessionId: sessionId },
  });
  if (!row) return false;
  const status = partial.status
    ? mapAdapterStatus(partial.status)
    : row.verificationStatus;
  await prisma.bnhubTrustIdentityVerification.update({
    where: { id: row.id },
    data: {
      verificationStatus: status,
      resultSummary: partial.safeSummary ?? row.resultSummary,
    },
  });
  await logIdentityAction({
    actorType: BnhubTrustIdentityAuditActor.WEBHOOK,
    userId: row.userId,
    actionType: "webhook_update",
    actionSummary: partial.safeSummary ?? "webhook",
    after: { status },
  });
  return true;
}
