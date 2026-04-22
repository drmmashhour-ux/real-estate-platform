import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { getVideoProjectBundle } from "@/modules/video-engine/video-project.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await ctx.params;
  const bundle = await getVideoProjectBundle(id);
  if (!bundle) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json({
    renderManifest: bundle.renderManifestJson,
    mediaPackage: bundle.mediaPackageJson,
    script: bundle.scriptJson,
    status: bundle.status,
    title: bundle.title,
    marketingHubPostId: bundle.marketingHubPostId,
  });
}
