import bcrypt from "bcrypt";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (!process.env.JWT_SECRET?.trim()) {
    return Response.json({ error: "JWT_SECRET is not configured" }, { status: 500 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return Response.json({ error: "Invalid credentials" });
  }

  return Response.json({ token: signToken(user) });
}
