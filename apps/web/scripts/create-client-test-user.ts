/**
 * Create or update a verified USER account for client UAT (can log in without email verification).
 *
 * Run from apps/web with DATABASE_URL pointing at the target database:
 *
 *   CLIENT_TEST_EMAIL=client.demo@yourdomain.com CLIENT_TEST_PASSWORD='StrongPass123!' npx tsx scripts/create-client-test-user.ts
 *
 * Or: npm run client:test-user
 *
 * Do not commit real passwords. Share credentials with clients over a secure channel.
 */
import path from "node:path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/auth/password";

config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
  const email = process.env.CLIENT_TEST_EMAIL?.trim().toLowerCase() ?? "";
  const password = process.env.CLIENT_TEST_PASSWORD ?? "";
  const name = process.env.CLIENT_TEST_NAME?.trim() || "Client demo";

  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL is required (e.g. in apps/web/.env or export for production).");
    process.exit(1);
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Set CLIENT_TEST_EMAIL to a valid email (e.g. client.demo@yourdomain.com).");
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Set CLIENT_TEST_PASSWORD to at least 8 characters.");
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role: "USER",
      emailVerifiedAt: now,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      accountStatus: "ACTIVE",
    },
    create: {
      email,
      name,
      role: "USER",
      passwordHash,
      emailVerifiedAt: now,
      plan: "free",
    },
  });

  console.log(`OK — verified test user ready: ${email}`);
  console.log("Share the password securely with your client; do not paste it in tickets or email in plain text.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
