import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  return Response.json(await prisma.message.create({ data: await req.json() }));
}
