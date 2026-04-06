import type { IUserRepository } from "../domain/ports/UserRepository.js";
import { randomBytes } from "crypto";
import { createHash } from "crypto";
import type { PrismaClient } from "../generated/prisma/index.js";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/** Creates a password reset token for the user. Does not leak whether email exists. */
export class ForgotPassword {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: { email: string }): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(input.email.trim().toLowerCase());
    if (!user) {
      return { message: "If an account exists with this email, you will receive a reset link." };
    }

    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    // In production: send email with link containing rawToken (e.g. /reset-password?token=rawToken)
    // For API testing / dev, the client could display the token when NODE_ENV=development.
    return { message: "If an account exists with this email, you will receive a reset link." };
  }
}
