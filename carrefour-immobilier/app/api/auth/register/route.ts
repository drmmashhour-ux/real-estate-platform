import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password, role } = await req.json();

  const hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, password: hash, role: role as Role },
  });

  const { password: _pw, ...safe } = user;
  return Response.json(safe);
}
