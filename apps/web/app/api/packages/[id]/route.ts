import { NextRequest } from "next/server";
import { getPackageById } from "@/lib/travel-packages";

/**
 * GET /api/packages/[id] — Single package.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pkg = await getPackageById(id);
    if (!pkg) {
      return Response.json({ error: "Package not found" }, { status: 404 });
    }
    return Response.json(pkg);
  } catch (e) {
    console.error("GET /api/packages/[id]:", e);
    return Response.json({ error: "Failed to load package" }, { status: 500 });
  }
}
