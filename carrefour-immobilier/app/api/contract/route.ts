import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const data = await req.json();
  return Response.json(await prisma.contract.create({ data }));
}
