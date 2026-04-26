import { ImageResponse } from "next/og";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const runtime = "nodejs";

export async function GET(_req: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const link = await prisma.publicShareLink.findUnique({ where: { token } });
  if (!link) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "#fff",
          padding: 56,
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2 }}>
          {link.title ?? "LECIPM property insights"}
        </div>
        <div style={{ marginTop: 20, fontSize: 22, color: "#cbd5e1", maxWidth: 900 }}>
          {link.summaryLine ?? "Trust + deal signals — decision-intent analysis."}
        </div>
        <div style={{ marginTop: 40, display: "flex", gap: 32, fontSize: 26 }}>
          {link.trustScoreHint != null ? <span>Trust {link.trustScoreHint}</span> : null}
          {link.dealScoreHint != null ? <span>Deal {link.dealScoreHint}</span> : null}
        </div>
        <div style={{ marginTop: 48, fontSize: 18, color: "#94a3b8" }}>lecipm.com</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
