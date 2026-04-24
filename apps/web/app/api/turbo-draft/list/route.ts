import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const drafts = await prisma.turboDraft.findMany({
      where: {
        OR: [
          { userId: auth.user.id },
          // If broker, show drafts they are reviewing (simplified for now)
          ...(auth.user.role === "BROKER" || auth.user.role === "ADMIN" ? [{ status: "READY_TO_REVIEW" }] : [])
        ]
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(drafts);
  } catch (err) {
    console.error("[api:turbo-draft:list] error", err);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }
}
