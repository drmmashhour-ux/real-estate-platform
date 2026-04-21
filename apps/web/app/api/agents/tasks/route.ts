import { NextResponse } from "next/server";
import { listExecutiveTasks } from "@/modules/agents/executive-task.service";
import { requireAgentsSession } from "../_auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAgentsSession();
  if (!auth.ok) return auth.response;

  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;

  const tasks = await listExecutiveTasks(auth.userId, status ? { status } : undefined);
  return NextResponse.json({ tasks });
}
