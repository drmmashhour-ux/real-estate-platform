import { NextRequest, NextResponse } from "next/server";
import type { BrokerClientStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { DemoEvents } from "@/lib/demo-event-types";
import { trackDemoEvent } from "@/lib/demo-analytics";
import { requireBrokerOrAdminApi } from "@/modules/crm/services/require-broker-api";
import {
  parseNotes,
  parseOptionalEmail,
  parseOptionalPhone,
  parseRequiredName,
  parseSource,
  parseTags,
  parseTargetCity,
} from "@/modules/crm/services/validation";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const statusParam = searchParams.get("status")?.trim();
  const sort = searchParams.get("sort") === "updated" ? "updated" : "newest";
  const tagsRaw =
    searchParams.get("tags")?.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean) ?? [];
  const brokerFilter = searchParams.get("brokerId")?.trim();

  let brokerIdScope: string | undefined;
  if (session.role === "ADMIN") {
    brokerIdScope = brokerFilter || undefined;
  } else {
    brokerIdScope = session.id;
  }

  const where: Prisma.BrokerClientWhereInput = {
    ...(brokerIdScope ? { brokerId: brokerIdScope } : {}),
    ...(statusParam && statusParam !== "all"
      ? { status: statusParam as BrokerClientStatus }
      : {}),
    ...(tagsRaw.length ? { tags: { hasEvery: tagsRaw } } : {}),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { targetCity: { contains: q, mode: "insensitive" } },
            { tags: { has: q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const orderBy =
    sort === "updated" ? { updatedAt: "desc" as const } : { createdAt: "desc" as const };

  const clients = await prisma.brokerClient.findMany({
    where,
    orderBy,
    take: 300,
    include: {
      interactions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          createdAt: true,
          completedAt: true,
        },
      },
    },
  });

  return NextResponse.json({ ok: true, clients });
}

export async function POST(request: NextRequest) {
  const gate = await requireBrokerOrAdminApi();
  if (!gate.ok) return gate.response;
  const { session } = gate;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  let brokerId = session.id;
  if (session.role === "ADMIN") {
    const raw = typeof body.brokerId === "string" ? body.brokerId.trim() : "";
    if (!raw) {
      return NextResponse.json({ error: "brokerId is required when creating as admin" }, { status: 400 });
    }
    const brokerUser = await prisma.user.findUnique({
      where: { id: raw },
      select: { id: true, role: true },
    });
    if (!brokerUser || brokerUser.role !== "BROKER") {
      return NextResponse.json({ error: "brokerId must be a broker user" }, { status: 400 });
    }
    brokerId = brokerUser.id;
  }

  const fullName = parseRequiredName(body.fullName);
  if (!fullName.ok) return NextResponse.json({ error: fullName.error }, { status: 400 });
  const email = parseOptionalEmail(body.email);
  if (!email.ok) return NextResponse.json({ error: email.error }, { status: 400 });
  const phone = parseOptionalPhone(body.phone);
  if (!phone.ok) return NextResponse.json({ error: phone.error }, { status: 400 });
  const notes = parseNotes(body.notes);
  if (!notes.ok) return NextResponse.json({ error: notes.error }, { status: 400 });
  const source = parseSource(body.source);
  if (!source.ok) return NextResponse.json({ error: source.error }, { status: 400 });
  const targetCity = parseTargetCity(body.targetCity);
  if (!targetCity.ok) return NextResponse.json({ error: targetCity.error }, { status: 400 });
  const tags = parseTags(body.tags);
  if (!tags.ok) return NextResponse.json({ error: tags.error }, { status: 400 });

  let userId: string | null = null;
  if (body.userId != null && body.userId !== "") {
    const uid = typeof body.userId === "string" ? body.userId.trim() : "";
    if (!uid) {
      return NextResponse.json({ error: "userId is invalid" }, { status: 400 });
    }
    const u = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
    if (!u) return NextResponse.json({ error: "Linked user not found" }, { status: 400 });
    userId = u.id;
  }

  let budgetMin: number | null | undefined;
  let budgetMax: number | null | undefined;
  if (body.budgetMin != null && body.budgetMin !== "") {
    const n = typeof body.budgetMin === "number" ? body.budgetMin : parseFloat(String(body.budgetMin));
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "budgetMin is invalid" }, { status: 400 });
    budgetMin = n;
  }
  if (body.budgetMax != null && body.budgetMax !== "") {
    const n = typeof body.budgetMax === "number" ? body.budgetMax : parseFloat(String(body.budgetMax));
    if (!Number.isFinite(n) || n < 0) return NextResponse.json({ error: "budgetMax is invalid" }, { status: 400 });
    budgetMax = n;
  }
  if (budgetMin != null && budgetMax != null && budgetMin > budgetMax) {
    return NextResponse.json({ error: "budgetMin cannot exceed budgetMax" }, { status: 400 });
  }

  let status: BrokerClientStatus = "LEAD";
  if (typeof body.status === "string" && body.status.trim()) {
    const s = body.status.trim() as BrokerClientStatus;
    const allowed: BrokerClientStatus[] = [
      "LEAD",
      "CONTACTED",
      "QUALIFIED",
      "VIEWING",
      "NEGOTIATING",
      "UNDER_CONTRACT",
      "CLOSED",
      "LOST",
    ];
    if (!allowed.includes(s)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    status = s;
  }

  const client = await prisma.brokerClient.create({
    data: {
      brokerId,
      userId,
      fullName: fullName.value,
      email: email.value ?? null,
      phone: phone.value ?? null,
      status,
      source: source.value ?? null,
      budgetMin: budgetMin ?? null,
      budgetMax: budgetMax ?? null,
      targetCity: targetCity.value ?? null,
      notes: notes.value ?? null,
      tags: tags.value,
    },
  });

  void trackDemoEvent(DemoEvents.CRM_CLIENT_CREATED, { status: client.status }, session.id);

  return NextResponse.json({ ok: true, client });
}
