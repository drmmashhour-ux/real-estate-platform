import type { IUserRepository } from "../domain/ports/UserRepository.js";
import type { ITokenService } from "../domain/ports/TokenService.js";
import type { ISessionRepository } from "../domain/ports/SessionRepository.js";
import { toPublic } from "../domain/entities/User.js";

export interface RefreshInput {
  refreshToken: string;
}

export interface AuthResult {
  user: ReturnType<typeof toPublic>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RefreshTokens {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly tokenService: ITokenService,
    private readonly sessionRepo: ISessionRepository,
    private readonly accessExpiresInSeconds: number,
    private readonly refreshExpiresInSeconds: number
  ) {}

  async execute(input: RefreshInput): Promise<AuthResult> {
    const payload = this.tokenService.verifyRefresh(input.refreshToken);

    const crypto = await import("node:crypto");
    const tokenHash = crypto.createHash("sha256").update(input.refreshToken).digest("hex");
    const session = await this.sessionRepo.findByTokenHash(tokenHash);
    if (!session) {
      throw new Error("INVALID_REFRESH_TOKEN");
    }
    if (session.expiresAt < new Date()) {
      await this.sessionRepo.deleteByTokenHash(tokenHash);
      throw new Error("REFRESH_TOKEN_EXPIRED");
    }

    const user = await this.userRepo.findById(payload.sub);
    if (!user) {
      await this.sessionRepo.deleteByTokenHash(tokenHash);
      throw new Error("USER_NOT_FOUND");
    }
    if (user.suspendedAt) {
      throw new Error("ACCOUNT_SUSPENDED");
    }

    // Optional: rotate refresh token (invalidate old, issue new)
    await this.sessionRepo.deleteByTokenHash(tokenHash);

    const newPayload = { sub: user.id, email: user.email, roles: user.roles };
    const accessToken = this.tokenService.signAccess(newPayload);
    const refreshToken = this.tokenService.signRefresh(newPayload);

    const newTokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + this.refreshExpiresInSeconds * 1000);
    await this.sessionRepo.create(user.id, newTokenHash, expiresAt);

    return {
      user: toPublic(user),
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }
}
