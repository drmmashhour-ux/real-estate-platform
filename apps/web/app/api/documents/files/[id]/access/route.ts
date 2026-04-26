import { DocumentEventType, type DocumentAccessLevel } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import {
  canManageDocument,
  type UserForDocuments,
} from "@/modules/documents/services/document-permissions";
import { logDocumentEvent } from "@/modules/documents/services/log-document-event";
import { serializeDocumentFile } from "@/modules/documents/services/serialize-file";

export const dynamic = "force-dynamic";

const LEVELS = new Set<string>(["VIEW", "COMMENT", "EDIT", "MANAGE"]);

/**
 * POST /api/documents/files/:id/access — replace explicit grants (userId + access).
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const file = await prisma.documentFile.findUnique({ where: { id } });
  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const u: UserForDocuments = { id: user.userId, role: user.role };
  if (!(await canManageDocument(u, file))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as {
    grants?: { userId: string; access: string }[];
  } | null;
  if (!body || !Array.isArray(body.grants)) {
    return NextResponse.json({ error: "grants array required" }, { status: 400 });
  }

  for (const g of body.grants) {
    if (!g.userId || !g.access || !LEVELS.has(g.access)) {
      return NextResponse.json({ error: "Invalid grant row" }, { status: 400 });
    }
    if (g.userId === user.userId) {
      return NextResponse.json({ error: "Cannot grant to self" }, { status: 400 });
    }
  }

  const keepIds = body.grants.map((g) => g.userId);

  await prisma.$transaction([
    prisma.documentAccessGrant.deleteMany({
      where: keepIds.length
        ? { documentFileId: id, userId: { notIn: keepIds } }
        : { documentFileId: id },
    }),
    ...body.grants.map((g) =>
      prisma.documentAccessGrant.upsert({
        where: {
          documentFileId_userId: { documentFileId: id, userId: g.userId },
        },
        create: {
          documentFileId: id,
          userId: g.userId,
          access: g.access as DocumentAccessLevel,
        },
        update: { access: g.access as DocumentAccessLevel },
      })
    ),
  ]);

  await logDocumentEvent({
    type: DocumentEventType.ACCESS_CHANGED,
    actorId: user.userId,
    documentFileId: id,
    metadata: { grantCount: body.grants.length },
  });

  const updated = await prisma.documentFile.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      accessGrants: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({
    file: updated
      ? {
          ...serializeDocumentFile(updated),
          accessGrants: updated.accessGrants.map((g) => ({
            userId: g.userId,
            access: g.access,
            user: g.user,
          })),
        }
      : null,
  });
}
