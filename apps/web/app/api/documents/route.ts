import { NextRequest, NextResponse } from "next/server";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";
import { getDocumentCenterPayload } from "@/modules/documents/services/get-document-center";
import {
  queryDocumentsForUser,
  type DocumentSearchFilters,
} from "@/modules/documents/services/query-documents";
import type { DocumentCategory, DocumentVisibility } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/documents — document center payload + optional search filters.
 */
export async function GET(request: NextRequest) {
  const user = await requireDocumentUser(request);
  if (user instanceof NextResponse) return user;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? undefined;
  const hasSearch =
    q ||
    searchParams.get("category") ||
    searchParams.get("visibility") ||
    searchParams.get("contextType") ||
    searchParams.get("from") ||
    searchParams.get("to") ||
    searchParams.get("uploaderName");

  const center = await getDocumentCenterPayload(user.userId, user.role);

  let searchResults: Awaited<ReturnType<typeof queryDocumentsForUser>> | undefined;
  if (hasSearch) {
    const filters: DocumentSearchFilters = {
      q,
      category: (searchParams.get("category") as DocumentCategory | null) ?? undefined,
      visibility: (searchParams.get("visibility") as DocumentVisibility | null) ?? undefined,
      contextType:
        (searchParams.get("contextType") as DocumentSearchFilters["contextType"]) ?? undefined,
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      uploaderName: searchParams.get("uploaderName") ?? undefined,
    };
    searchResults = await queryDocumentsForUser(user.userId, user.role, filters);
  }

  return NextResponse.json({ ...center, searchResults });
}
