import { getUserRole, isHubAdminRole } from "@/lib/auth/session";
import { queryAdminAi } from "@/lib/admin-ai/query-admin-ai";
import { adminAiQueryBodySchema } from "@/lib/admin-ai/validators";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const role = await getUserRole();
  if (!isHubAdminRole(role)) {
    return Response.json({ error: "Admin required" }, { status: 403 });
  }

  const raw = await request.json().catch(() => ({}));
  const parsed = adminAiQueryBodySchema.safeParse(raw);
  if (!parsed.success) {
    return Response.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = await queryAdminAi(parsed.data.question);
  return Response.json(result);
}
