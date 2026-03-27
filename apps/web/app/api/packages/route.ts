import { getPackages } from "@/lib/travel-packages";

/**
 * GET /api/packages — List all travel packages.
 */
export async function GET() {
  try {
    const packages = await getPackages();
    return Response.json(packages);
  } catch (e) {
    console.error("GET /api/packages:", e);
    return Response.json({ error: "Failed to load packages" }, { status: 500 });
  }
}
