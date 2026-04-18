import { z } from "zod";
import { launchSystemV1Flags, lecipmLaunchInvestorFlags } from "@/config/feature-flags";
import { requirePlatformLaunchInvestor } from "@/lib/launch-investor-api-auth";
import { buildFullInvestorPitchPackage } from "@/modules/investor-pitch/pitch.service";
import { exportPitchDeckAsMarkdown } from "@/modules/pitch-export/export-ppt.service";
import { exportPitchDeckAsPrintableHtml } from "@/modules/pitch-export/export-pdf.service";
import { logGrowthEngineAudit } from "@/modules/growth-engine-audit/growth-engine-audit.service";
import { trackInvestorPitchExported } from "@/lib/analytics/launch-analytics";

export const dynamic = "force-dynamic";

const BodyZ = z.object({
  kind: z.enum(["pitch_markdown", "pitch_html"]),
});

/**
 * POST /api/investor/export — downloadable pitch deck (markdown or printable HTML).
 * For metrics CSV/JSON use POST /api/launch/investor/export.
 */
export async function POST(req: Request) {
  const auth = await requirePlatformLaunchInvestor();
  if (!auth.ok) return auth.response;
  if (!launchSystemV1Flags.investorPitchDeckV1 || !lecipmLaunchInvestorFlags.investorMetricsV1) {
    return Response.json({ error: "Investor pitch export disabled" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    json = {};
  }
  const parsed = BodyZ.safeParse(json);
  const kind = parsed.success ? parsed.data.kind : "pitch_markdown";

  const pkg = await buildFullInvestorPitchPackage();
  const out =
    kind === "pitch_html"
      ? exportPitchDeckAsPrintableHtml(pkg.deck.title, pkg.deck.slides)
      : exportPitchDeckAsMarkdown(pkg.deck.title, pkg.deck.slides);

  await logGrowthEngineAudit({
    actorUserId: auth.userId,
    action: "investor_pitch_deck_export",
    payload: { kind, filename: out.filename },
  });
  trackInvestorPitchExported({ kind, filename: out.filename });

  const contentType = kind === "pitch_html" ? "text/html; charset=utf-8" : "text/markdown; charset=utf-8";

  return new Response(out.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${out.filename}"`,
    },
  });
}
