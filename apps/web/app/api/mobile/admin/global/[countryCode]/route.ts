import { PlatformRole } from "@prisma/client";

import { getMobileAuthUser } from "@/modules/auth/mobile-auth";
import { buildCountryDetailView } from "@/modules/global-expansion/global-country.service";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, ctx: { params: Promise<{ countryCode: string }> }) {
  const auth = await getMobileAuthUser(_request);
  if (!auth) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (auth.role !== PlatformRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { countryCode } = await ctx.params;
  const code = decodeURIComponent(countryCode).toUpperCase();

  try {
    const view = buildCountryDetailView(code);
    if (!view) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(view);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "global_expansion_failed";
    return Response.json({ error: msg }, { status: 500 });
  }
}
