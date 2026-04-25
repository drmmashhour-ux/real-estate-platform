import { prisma } from "@repo/db";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function GET(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? "open";
  const entityType = searchParams.get("entityType");
  const severity = searchParams.get("severity");

  const flags = await prisma.fraudFlag.findMany({
    where: {
      ...(status === "all" ? {} : { status }),
      ...(entityType ? { entityType } : {}),
      ...(severity ? { severity } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 150,
  });

  return Response.json({ flags });
}
