import { NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** Placeholder validation — future: clause library, jurisdiction rules, AI suggestions. */
export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required", errors: ["Sign in required"] }, { status: 401 });
  }
  const role = await getUserRole();
  if (role !== "BROKER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Broker access required", errors: ["Broker access required"] }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errors: ["Invalid JSON"] }, { status: 400 });
  }

  const o = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const clauses = o.clauses;

  if (!Array.isArray(clauses)) {
    return NextResponse.json({ errors: ["clauses must be an array"] }, { status: 400 });
  }

  const errors: string[] = [];

  clauses.forEach((c, i) => {
    if (typeof c !== "string") {
      errors.push(`Clause ${i + 1} must be text`);
      return;
    }
    const text = c.trim();
    if (!text) {
      errors.push(`Clause ${i + 1} is empty`);
      return;
    }
    if (!text.toLowerCase().includes("must")) {
      errors.push(`Clause ${i + 1} missing clear obligation`);
    }
    if (!/\d/.test(text)) {
      errors.push(`Clause ${i + 1} missing deadline`);
    }
  });

  return NextResponse.json({ errors });
}
