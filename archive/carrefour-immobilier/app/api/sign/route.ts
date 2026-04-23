import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  return Response.json(await prisma.signature.create({ data: await req.json() }));
}
