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
 * GET /api/storage/status
 * Returns { used, limit, percent, status } for alerts and UI.
 * status: safe | warning | critical | full
 */
export async function GET() {
  try {
    const userId = await getGuestId();
    if (!userId) {
      const defaultLimit = 500 * 1024 * 1024;
      return Response.json(
        { used: "0B", limit: formatBytes(defaultLimit), percent: 0, status: "safe", usedBytes: 0, limitBytes: defaultLimit },
        { status: 200 }
      );
    }

    const { usedBytes, limitBytes, percent, status } = await getUsage(userId);
    return Response.json({
      used: formatBytes(usedBytes),
      limit: formatBytes(limitBytes),
      percent,
      status,
      usedBytes,
      limitBytes,
    });
  } catch (e) {
    console.error(e);
    return Response.json(
      { used: "0B", limit: formatBytes(500 * 1024 * 1024), percent: 0, status: "safe", usedBytes: 0, limitBytes: 500 * 1024 * 1024 },
      { status: 200 }
    );
  }
}
