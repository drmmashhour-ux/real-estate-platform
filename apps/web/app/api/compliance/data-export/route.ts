import { requireUser } from "@/modules/security/access-guard.service";
import { exportUserData } from "@/modules/compliance/compliance.service";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/compliance/data-export — export all personal data for the user
 */
export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const data = await exportUserData(auth.userId);
    
    // In a real app, this might generate a JSON or PDF for download
    return NextResponse.json({ 
      ok: true, 
      exportedAt: new Date().toISOString(),
      data 
    });
  } catch (error) {
    console.error("[compliance:api] data export failed", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
