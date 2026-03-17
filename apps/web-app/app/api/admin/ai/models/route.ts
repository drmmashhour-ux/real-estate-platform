import { NextRequest } from "next/server";
import { listAiModels, ensureAiModels } from "@/lib/ai-models";
import { registerModelVersion } from "@/lib/ai-models";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await ensureAiModels();
    const models = await listAiModels();
    return Response.json(models);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to list models" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelKey, version, metrics, deploy } = body;
    if (!modelKey || version == null) {
      return Response.json({ error: "modelKey, version required" }, { status: 400 });
    }
    const v = await registerModelVersion({
      modelKey,
      version: Number(version),
      metrics,
      deploy: !!deploy,
    });
    return Response.json(v);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to register version" }, { status: 500 });
  }
}
