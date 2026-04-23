import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { listAllCountryConfigsForExpansion } from "@/modules/global-expansion/global-country.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await getMobileAuthUser(request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return Response.json({ countries: listAllCountryConfigsForExpansion() });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "global_expansion_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
