import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";

const bodySchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const OWNER_USER = "user";

export async function POST(req: NextRequest) {
  const auth = await requireSessionUserIdOr401(req);
  if (auth instanceof NextResponse) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const sub = await prisma.pushSubscription.upsert({
    where: {
      ownerType_ownerId_endpoint: {
        ownerType: OWNER_USER,
        ownerId: auth.userId,
        endpoint: parsed.data.endpoint,
      },
    },
    create: {
      ownerType: OWNER_USER,
      ownerId: auth.userId,
      endpoint: parsed.data.endpoint,
      keys: parsed.data.keys as object,
    },
    update: {
      keys: parsed.data.keys as object,
    },
  });

  return NextResponse.json({ success: true, sub });
}
