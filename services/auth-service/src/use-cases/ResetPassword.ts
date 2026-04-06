import type { IUserRepository } from "../domain/ports/UserRepository.js";
import type { IPasswordHasher } from "../domain/ports/PasswordHasher.js";
import { createHash } from "crypto";
import type { PrismaClient } from "../generated/prisma/index.js";

export class ResetPassword {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly prisma: PrismaClient
  ) {}

  async execute(input: { token: string; newPassword: string }): Promise<{ success: boolean; message: string }> {
    const tokenHash = createHash("sha256").update(input.token).digest("hex");
    const now = new Date();

    const row = await this.prisma.passwordResetToken.findFirst({
      where: { tokenHash },
    });

    if (!row || row.usedAt || row.expiresAt < now) {
      return { success: false, message: "Invalid or expired reset token." };
    }

    const user = await this.userRepo.findById(row.userId);
    if (!user) {
      return { success: false, message: "User not found." };
    }

    const passwordHash = await this.passwordHasher.hash(input.newPassword);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    await this.prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: now },
    });

    return { success: true, message: "Password has been reset." };
  }
}
