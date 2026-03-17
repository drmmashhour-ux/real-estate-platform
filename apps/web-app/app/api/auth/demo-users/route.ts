import { prisma } from "@/lib/db";

/** GET /api/auth/demo-users — List demo users for login dropdown (dev/demo only). */
export async function GET() {
  const users = await prisma.user.findMany({
    where: { email: { in: ["guest@demo.com", "host@demo.com"] } },
    select: { id: true, email: true, name: true, role: true },
    orderBy: { email: "asc" },
  });
  return Response.json(users);
}
