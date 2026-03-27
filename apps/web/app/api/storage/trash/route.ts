import { getGuestId } from "@/lib/auth/session";
import { listTrash, restoreFile } from "@/lib/storage/retention";

export const dynamic = "force-dynamic";

/**
 * GET /api/storage/trash – list soft-deleted files (within 30-day retention).
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const items = await listTrash(userId);
    return Response.json({
      items: items.map((r) => ({
        id: r.id,
        fileUrl: r.fileUrl,
        fileType: r.fileType,
        originalSize: r.originalSize,
        deletedAt: r.deletedAt,
        retentionPolicy: r.retentionPolicy,
      })),
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load trash" }, { status: 500 });
  }
}

/**
 * POST /api/storage/trash – restore a file. Body: { recordId: string }
 */
export async function POST(request: Request) {
  try {
    const userId = await getGuestId();
    if (!userId) return Response.json({ error: "Sign in required" }, { status: 401 });
    const body = await request.json().catch(() => ({}));
    const recordId = body?.recordId;
    if (!recordId) return Response.json({ error: "recordId required" }, { status: 400 });
    await restoreFile(recordId, userId);
    return Response.json({ success: true });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to restore" }, { status: 500 });
  }
}
