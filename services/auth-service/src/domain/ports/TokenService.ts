export interface TokenPayload {
  sub: string;
  email: string;
  roles: string[];
  type: "access" | "refresh";
  iat?: number;
  exp?: number;
}

export interface ITokenService {
  signAccess(payload: Omit<TokenPayload, "type" | "iat" | "exp">): string;
  signRefresh(payload: Omit<TokenPayload, "type" | "iat" | "exp">): string;
  verifyAccess(token: string): TokenPayload;
  verifyRefresh(token: string): TokenPayload;
}
