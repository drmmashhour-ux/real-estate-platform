import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: body.email,
        password: hashed,
      },
    });

    return Response.json({ id: user.id, email: user.email });
  } catch (error: any) {
    console.error("Registration error:", error);
    return Response.json({ error: error.message || "Failed to register user" }, { status: 500 });
  }
}
