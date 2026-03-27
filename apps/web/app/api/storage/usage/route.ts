import { getGuestId } from "@/lib/auth/session";
import { getUsage } from "@/lib/storage-quota";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(1) + "GB";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(0) + "MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + "KB";
  return bytes + "B";
}

/**
 * GET /api/storage/usage
 * Returns { used, limit, percent } in human-readable form (e.g. "120MB", "500MB").
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      return Response.json(
        { used: "0B", limit: "0B", percent: 0, usedBytes: 0, limitBytes: 0 },
        { status: 200 }
      );
    }

    const { usedBytes, limitBytes, percent } = await getUsage(userId);
    return Response.json({
      used: formatBytes(usedBytes),
      limit: formatBytes(limitBytes),
      percent,
      usedBytes,
      limitBytes,
    });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to load storage usage" }, { status: 500 });
  }
}
