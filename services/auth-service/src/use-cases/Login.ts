import type { IUserRepository } from "../domain/ports/UserRepository.js";
import type { IPasswordHasher } from "../domain/ports/PasswordHasher.js";
import type { ITokenService } from "../domain/ports/TokenService.js";
import type { ISessionRepository } from "../domain/ports/SessionRepository.js";
import { toPublic } from "../domain/entities/User.js";

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResult {
  user: ReturnType<typeof toPublic>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class Login {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionRepo: ISessionRepository,
    private readonly accessExpiresInSeconds: number,
    private readonly refreshExpiresInSeconds: number
  ) {}

  async execute(input: LoginInput): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(input.email.trim().toLowerCase());
    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (user.suspendedAt) {
      throw new Error("ACCOUNT_SUSPENDED");
    }

    if (!user.passwordHash) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const valid = await this.passwordHasher.verify(input.password, user.passwordHash);
    if (!valid) {
      throw new Error("INVALID_CREDENTIALS");
    }

    await this.userRepo.updateLastLoginAt(user.id, new Date());

    const payload = { sub: user.id, email: user.email, roles: user.roles };
    const accessToken = this.tokenService.signAccess(payload);
    const refreshToken = this.tokenService.signRefresh(payload);

    const crypto = await import("node:crypto");
    const tokenHash = crypto.createHash("sha256").update(refreshToken).digest("hex");
    const expiresAt = new Date(Date.now() + this.refreshExpiresInSeconds * 1000);
    await this.sessionRepo.create(user.id, tokenHash, expiresAt);

    return {
      user: toPublic(user),
      accessToken,
      refreshToken,
      expiresIn: this.accessExpiresInSeconds,
    };
  }
}
