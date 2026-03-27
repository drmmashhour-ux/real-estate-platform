import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { getMortgageExpertForUserId } from "@/modules/mortgage/services/expert-service";
import { isMortgageExpertRole } from "@/lib/marketplace/mortgage-role";
import type { Prisma } from "@prisma/client";

export type MortgageExpertWithPlan = Prisma.MortgageExpertGetPayload<{
  include: { expertSubscription: true; expertCredits: true; expertBilling: true };
}>;

export function termsRequiredResponse() {
  return NextResponse.json(
    { error: "Accept the expert terms to continue.", code: "TERMS_REQUIRED" },
    { status: 403 }
  );
}

export type ExpertSessionOk = {
  userId: string;
  expert: MortgageExpertWithPlan;
};

/**
 * Authenticated mortgage expert session. Does not enforce terms (use requireExpertTermsAccepted for dashboard APIs).
 */
export async function requireMortgageExpertSession(): Promise<
  ExpertSessionOk | { error: NextResponse }
> {
  const userId = await getGuestId();
  if (!userId) {
    return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!isMortgageExpertRole(user?.role)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const expert = await getMortgageExpertForUserId(userId);
  if (!expert) {
    return { error: NextResponse.json({ error: "Expert profile missing" }, { status: 404 }) };
  }
  return { userId, expert };
}

export async function requireMortgageExpertWithTerms(): Promise<
  ExpertSessionOk | { error: NextResponse }
> {
  const session = await requireMortgageExpertSession();
  if ("error" in session) return session;
  if (!session.expert.acceptedTerms) {
    return { error: termsRequiredResponse() };
  }
  return session;
}
