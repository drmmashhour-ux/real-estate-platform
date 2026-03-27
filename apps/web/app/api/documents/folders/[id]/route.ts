import { NextRequest, NextResponse } from "next/server";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import { getFolderDetailForViewer } from "@/modules/documents/services/folder-detail";
import type { UserForDocuments } from "@/modules/documents/services/document-permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents/folders/:id — folder detail, visible files, activity.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;
  const { id } = await context.params;

  const u: UserForDocuments = { id: user.userId, role: user.role };
  const detail = await getFolderDetailForViewer(id, u);
  if (!detail.ok) {
    if (detail.reason === "not_found") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    folder: detail.folder,
    files: detail.files,
    events: detail.events,
  });
}
