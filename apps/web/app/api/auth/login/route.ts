import { prisma } from "@repo/db";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth/jwt";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Check both password and passwordHash fields for compatibility
    const passwordToCompare = user.password || user.passwordHash;

    if (!passwordToCompare) {
      return Response.json({ error: "User has no password set" }, { status: 401 });
    }

    const valid = await bcrypt.compare(body.password, passwordToCompare);

    if (!valid) {
      return Response.json({ error: "Invalid password" }, { status: 401 });
    }

    const token = signToken({ userId: user.id });

    cookies().set("token", token, {
      httpOnly: true,
      path: "/",
    });

    return Response.json({
      user: { id: user.id, email: user.email },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return Response.json({ error: error.message || "Failed to login" }, { status: 500 });
  }
}
