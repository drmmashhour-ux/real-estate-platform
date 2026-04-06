/**
 * Upsert four verified users for pre-launch manual / Playwright testing.
 *
 *   DEMO_MODE_ENABLED=0 PRELAUNCH_TEST_PASSWORD='your-strong-pass' npx tsx scripts/seed-prelaunch-test-users.ts
 *
 * Do not reuse passwords across environments; do not commit secrets.
 */
import path from "node:path";
import { config } from "dotenv";
import { type PlatformRole, PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

const USERS: { email: string; name: string; role: PlatformRole }[] = [
  { email: "buyer_user@test.com", name: "Prelaunch Buyer", role: "USER" },
  { email: "host_user@test.com", name: "Prelaunch Host", role: "HOST" },
  { email: "broker_user@test.com", name: "Prelaunch Broker", role: "BROKER" },
  { email: "admin_user@test.com", name: "Prelaunch Admin", role: "ADMIN" },
];

async function main() {
  const password = process.env.PRELAUNCH_TEST_PASSWORD?.trim();
  if (!password || password.length < 8) {
    console.error("Set PRELAUNCH_TEST_PASSWORD (min 8 characters).");
    process.exit(1);
  }
  const hash = await hashPassword(password);
  const now = new Date();
  for (const u of USERS) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        passwordHash: hash,
        name: u.name,
        role: u.role,
        emailVerifiedAt: now,
        accountStatus: "ACTIVE",
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: hash,
        emailVerifiedAt: now,
        plan: "free",
        accountStatus: "ACTIVE",
      },
    });
    console.log(`[prelaunch-users] OK ${u.email} (${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
