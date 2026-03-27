import jwt from "jsonwebtoken";
import type { ITokenService, TokenPayload } from "../../domain/ports/TokenService.js";

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export class JwtTokenService implements ITokenService {
  constructor(private readonly config: JwtConfig) {}

  signAccess(payload: Omit<TokenPayload, "type" | "iat" | "exp">): string {
    return jwt.sign(
      { ...payload, type: "access" },
      this.config.accessSecret,
      { expiresIn: this.config.accessExpiresIn } as jwt.SignOptions
    );
  }

  signRefresh(payload: Omit<TokenPayload, "type" | "iat" | "exp">): string {
    return jwt.sign(
      { ...payload, type: "refresh" },
      this.config.refreshSecret,
      { expiresIn: this.config.refreshExpiresIn } as jwt.SignOptions
    );
  }

  verifyAccess(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.config.accessSecret) as TokenPayload;
    if (decoded.type !== "access") throw new Error("INVALID_TOKEN_TYPE");
    return decoded;
  }

  verifyRefresh(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.config.refreshSecret) as TokenPayload;
    if (decoded.type !== "refresh") throw new Error("INVALID_TOKEN_TYPE");
    return decoded;
  }
}
