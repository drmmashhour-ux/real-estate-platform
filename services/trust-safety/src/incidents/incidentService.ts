import { prisma } from "../db.js";
import type { CreateIncidentBody, ListIncidentsQuery } from "../validation/schemas.js";
import type { Prisma } from "../generated/prisma/index.js";

function toIncidentResponse(incident: {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  reportedListingId: string | null;
  type: string;
  description: string;
  status: string;
  priority: number;
  createdAt: Date;
  resolvedAt: Date | null;
  resolvedById: string | null;
  resolutionNotes: string | null;
}) {
  return {
    id: incident.id,
    reporterId: incident.reporterId,
    reportedUserId: incident.reportedUserId ?? null,
    reportedListingId: incident.reportedListingId ?? null,
    type: incident.type,
    description: incident.description,
    status: incident.status,
    priority: incident.priority,
    createdAt: incident.createdAt.toISOString(),
    resolvedAt: incident.resolvedAt?.toISOString() ?? null,
    resolvedById: incident.resolvedById ?? null,
    resolutionNotes: incident.resolutionNotes ?? null,
  };
}

export async function createIncident(data: CreateIncidentBody) {
  const incident = await prisma.incident.create({
    data: {
      reporterId: data.reporterId,
      reportedUserId: data.reportedUserId ?? undefined,
      reportedListingId: data.reportedListingId ?? undefined,
      type: data.type,
      description: data.description,
      priority: data.priority ?? 0,
    },
  });
  return toIncidentResponse(incident);
}

export async function listIncidents(query: ListIncidentsQuery) {
  const limit = query.limit ?? 20;
  const offset = query.offset ?? 0;

  const where: Prisma.IncidentWhereInput = {};
  if (query.reporterId) where.reporterId = query.reporterId;
  if (query.reportedUserId) where.reportedUserId = query.reportedUserId;
  if (query.reportedListingId) where.reportedListingId = query.reportedListingId;
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [items, total] = await Promise.all([
    prisma.incident.findMany({
      where,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: limit,
      skip: offset,
    }),
    prisma.incident.count({ where }),
  ]);

  return {
    data: items.map(toIncidentResponse),
    pagination: { limit, offset, total },
  };
}

/** Moderation queue: pending incidents (optionally with flags). */
export async function getModerationQueueIncidents(limit: number) {
  const items = await prisma.incident.findMany({
    where: { status: "PENDING" },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    take: limit,
  });
  return { data: items.map(toIncidentResponse) };
}
