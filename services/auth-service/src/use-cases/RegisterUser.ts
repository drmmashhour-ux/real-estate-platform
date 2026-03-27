import type { UserEntity } from "../domain/entities/User.js";
import type { IUserRepository } from "../domain/ports/UserRepository.js";
import type { IPasswordHasher } from "../domain/ports/PasswordHasher.js";
import type { ITokenService } from "../domain/ports/TokenService.js";
import type { ISessionRepository } from "../domain/ports/SessionRepository.js";
import { Role, DEFAULT_ROLE, isRole } from "../domain/enums/Role.js";
import { toPublic } from "../domain/entities/User.js";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string | null;
  phone?: string | null;
  locale?: string | null;
  role?: Role;
}

export interface AuthResult {
  user: ReturnType<typeof toPublic>;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class RegisterUser {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly sessionRepo: ISessionRepository,
    private readonly accessExpiresInSeconds: number,
    private readonly refreshExpiresInSeconds: number
  ) {}

  async execute(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const role = input.role != null && isRole(input.role) ? input.role : DEFAULT_ROLE;
    const passwordHash = await this.passwordHasher.hash(input.password);

    const user = await this.userRepo.create({
      email: input.email.trim().toLowerCase(),
      passwordHash,
      name: input.name ?? null,
      phone: input.phone ?? null,
      locale: input.locale ?? null,
      roles: [role],
    });

    return this.issueTokens(user);
  }

  private async issueTokens(user: UserEntity): Promise<AuthResult> {
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
