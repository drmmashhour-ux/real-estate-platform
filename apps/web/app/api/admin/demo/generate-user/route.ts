import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { hashPassword } from "@/lib/auth/password";
import type { PlatformRole } from "@prisma/client";

const ALLOWED: PlatformRole[] = ["USER", "TESTER", "CLIENT"];

/** POST — create a one-off staging tester (password returned once). Admin only. */
export async function POST(req: NextRequest) {
  const admin = await requireAdminSession();
  if (!admin.ok) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  let body: { role?: string; prefix?: string };
  try {
    body = (await req.json()) as { role?: string; prefix?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = (body.role?.toUpperCase() ?? "TESTER") as PlatformRole;
  if (!ALLOWED.includes(role)) {
    return NextResponse.json({ error: "Role must be USER, CLIENT, or TESTER." }, { status: 400 });
  }

  const prefix = (body.prefix ?? "staging-tester").replace(/[^a-z0-9-]/gi, "").slice(0, 32) || "staging-tester";
  const token = randomBytes(4).toString("hex");
  const email = `${prefix}-${token}@demo.lecipm.local`;
  const passwordPlain = `Demo${randomBytes(6).toString("base64url")}!`;
  const passwordHash = await hashPassword(passwordPlain);

  await prisma.user.create({
    data: {
      email,
      name: `Tester ${token}`,
      role,
      passwordHash,
      emailVerifiedAt: new Date(),
      plan: "free",
    },
  });

  return NextResponse.json({
    ok: true,
    email,
    password: passwordPlain,
    role,
  });
}
