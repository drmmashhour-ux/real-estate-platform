import type { MarketplacePersona, PlatformRole } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { assertSystemValidationAllowed } from "@/src/modules/system-validation/assertSafeTestEnvironment";

export type TestUserSpec = {
  email: string;
  role: PlatformRole;
  persona: MarketplacePersona;
  plan: "free" | "pro";
};

export type GeneratedTestUser = TestUserSpec & { id: string; password: string };

const TAG = "lecipm.sv";

function emailFor(slot: string): string {
  return `${TAG}.${slot}@test.lecipm.invalid`;
}

/**
 * Creates 5 free + 2 pro users (buyer / broker / investor mix), verified for password login.
 * Emails are under @test.lecipm.invalid — not deliverable; safe for isolated QA DBs.
 */
export async function generateTestUsers(): Promise<GeneratedTestUser[]> {
  assertSystemValidationAllowed();

  const password =
    process.env.SYSTEM_VALIDATION_USER_PASSWORD?.trim() ||
    (process.env.NODE_ENV === "test" ? "Test_Sv_Pass_9!" : "");
  if (!password || password.length < 12) {
    throw new Error(
      "Set SYSTEM_VALIDATION_USER_PASSWORD (min 12 chars) for system validation users.",
    );
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  const specs: TestUserSpec[] = [
    { email: emailFor("free-buyer-a"), role: "BUYER", persona: "BUYER", plan: "free" },
    { email: emailFor("free-buyer-b"), role: "BUYER", persona: "BUYER", plan: "free" },
    { email: emailFor("free-broker-a"), role: "BROKER", persona: "BROKER", plan: "free" },
    { email: emailFor("free-broker-b"), role: "BROKER", persona: "BROKER", plan: "free" },
    { email: emailFor("free-investor"), role: "INVESTOR", persona: "BUYER", plan: "free" },
    { email: emailFor("pro-buyer"), role: "BUYER", persona: "BUYER", plan: "pro" },
    { email: emailFor("pro-broker"), role: "BROKER", persona: "BROKER", plan: "pro" },
  ];

  const out: GeneratedTestUser[] = [];

  for (const s of specs) {
    const u = await prisma.user.upsert({
      where: { email: s.email },
      create: {
        email: s.email,
        name: `[SV] ${s.role} ${s.plan}`,
        role: s.role,
        marketplacePersona: s.persona,
        plan: s.plan,
        passwordHash,
        emailVerifiedAt: now,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        accountStatus: "ACTIVE",
      },
      update: {
        name: `[SV] ${s.role} ${s.plan}`,
        role: s.role,
        marketplacePersona: s.persona,
        plan: s.plan,
        passwordHash,
        emailVerifiedAt: now,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        accountStatus: "ACTIVE",
      },
      select: { id: true },
    });
    out.push({ ...s, id: u.id, password });
  }

  return out;
}
