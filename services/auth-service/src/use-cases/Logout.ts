import type { ISessionRepository } from "../domain/ports/SessionRepository.js";

export interface LogoutInput {
  refreshToken: string;
}

export class Logout {
  constructor(private readonly sessionRepo: ISessionRepository) {}

  async execute(input: LogoutInput): Promise<void> {
    const crypto = await import("node:crypto");
    const tokenHash = crypto.createHash("sha256").update(input.refreshToken).digest("hex");
    await this.sessionRepo.deleteByTokenHash(tokenHash);
  }
}
