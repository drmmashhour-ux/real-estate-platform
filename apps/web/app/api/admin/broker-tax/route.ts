import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getFinanceActor } from "@/lib/admin/finance-request";
import { logFinancialAction } from "@/lib/admin/financial-audit";
import type { PlatformRole, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

function buildBrokerTaxListWhere(filter: string, q: string | undefined): Prisma.UserWhereInput {
  const search: Prisma.UserWhereInput | undefined =
    q && q.length > 0
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined;

  const base: Prisma.UserWhereInput = {
    role: "BROKER" as PlatformRole,
    ...(search ? { AND: [search] } : {}),
  };

  switch (filter) {
    case "pending":
      return {
        ...base,
        brokerTaxRegistration: {
          status: { in: ["SUBMITTED", "FORMAT_VALID", "PENDING_STAFF_REVIEW", "MANUALLY_REVIEWED"] },
        },
      };
    case "approved":
      return { ...base, brokerTaxRegistration: { status: "APPROVED" } };
    case "rejected":
      return { ...base, brokerTaxRegistration: { status: "REJECTED" } };
    case "has_gst":
      return {
        ...base,
        brokerTaxRegistration: {
          AND: [{ gstNumber: { not: null } }, { NOT: { gstNumber: "" } }],
        },
      };
    case "missing":
      return {
        ...base,
        OR: [
          { brokerTaxRegistration: null },
          {
            brokerTaxRegistration: {
              AND: [{ province: "QC" }, { OR: [{ qstNumber: null }, { qstNumber: "" }] }],
            },
          },
        ],
      };
    default:
      return base;
  }
}

/**
 * GET /api/admin/broker-tax?filter=all|pending|approved|rejected|missing|has_gst
 * ADMIN + ACCOUNTANT only.
 */
export async function GET(request: NextRequest) {
  const actor = await getFinanceActor();
  if (!actor || (actor.role !== "ADMIN" && actor.role !== "ACCOUNTANT")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const filter = (searchParams.get("filter") ?? "all").toLowerCase();
  const q = searchParams.get("q")?.trim();

  const where = buildBrokerTaxListWhere(filter, q);

  const brokers = await prisma.user.findMany({
    where,
    select: {
      id: true,
      email: true,
      name: true,
      brokerStatus: true,
      brokerTaxRegistration: true,
    },
    orderBy: { email: "asc" },
    take: 200,
  });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  await logFinancialAction({
    actorUserId: actor.user.id,
    action: "broker_tax_admin_list",
    ipAddress: ip,
    metadata: { filter, q },
  });

  return Response.json({
    brokers,
    filter,
    disclaimer: "Format-checked only — not verified with Revenu Québec or CRA.",
  });
}
