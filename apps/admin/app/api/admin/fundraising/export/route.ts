import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import {
  buildFundraisingExportPayload,
  fundraisingPayloadToCsv,
  fundraisingPayloadToJson,
} from "@/src/modules/fundraising/fundraisingExport";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const uid = await getGuestId();
  if (!uid) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await isPlatformAdmin(uid))) return Response.json({ error: "Forbidden" }, { status: 403 });

  const format = req.nextUrl.searchParams.get("format") ?? "json";
  const payload = await buildFundraisingExportPayload();

  if (format === "csv") {
    return new Response(fundraisingPayloadToCsv(payload), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="lecipm-fundraising-traction.csv"`,
      },
    });
  }

  return new Response(fundraisingPayloadToJson(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="lecipm-fundraising-traction.json"`,
    },
  });
}
