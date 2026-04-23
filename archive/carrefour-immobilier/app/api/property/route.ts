import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  return Response.json(await prisma.property.create({ data: await req.json() }));
}

export async function GET() {
  return Response.json(await prisma.property.findMany());
}
