import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { PlatformRole } from "@prisma/client";
import { requireDocumentUser } from "@/modules/documents/services/api-helpers";

export async function requireNotificationUser(
  request: NextRequest
): Promise<{ userId: string; role: PlatformRole } | NextResponse> {
  return requireDocumentUser(request);
}
