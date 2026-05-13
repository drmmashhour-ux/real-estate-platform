import { randomUUID } from "node:crypto";
import { signMockJwt, verifyMockJwt } from "./mockJwt.js";
import type { AuthContext, Session, User, UserRole } from "./authTypes.js";
import type { ProductPersistencePort } from "../persistence/persistencePorts.js";

export class MockAuthService {
  private readonly users = new Map<string, User>();
  private readonly sessions = new Map<string, Session>();

  constructor(
    private readonly jwtSecret = "nexora-mock-auth-secret",
    private readonly persistence?: ProductPersistencePort,
  ) {}

  createUser(input: { email: string; role: UserRole; merchantId?: string }): User {
    if (input.role === "merchant" && !input.merchantId) {
      throw new Error("Merchant users require merchantId.");
    }
    const user = Object.freeze({
      id: randomUUID(),
      email: input.email,
      role: input.role,
      ...(input.merchantId ? { merchantId: input.merchantId } : {}),
      createdAt: new Date(),
    });
    this.users.set(user.id, user);
    this.persistence?.saveUser({
      id: user.id,
      email: user.email,
      role: user.role,
      ...(user.merchantId ? { merchantId: user.merchantId } : {}),
      createdAt: user.createdAt,
    });
    return user;
  }

  createSession(userId: string, ttlSeconds = 3600): Session {
    const user = this.getUser(userId);
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const token = signMockJwt(
      {
        sub: user.id,
        role: user.role,
        ...(user.merchantId ? { merchantId: user.merchantId } : {}),
        sessionId,
        exp: Math.floor(expiresAt.getTime() / 1000),
      },
      this.jwtSecret,
    );
    const session = Object.freeze({
      id: sessionId,
      userId: user.id,
      token,
      expiresAt,
      createdAt: new Date(),
    });
    this.sessions.set(session.id, session);
    return session;
  }

  authenticate(token: string): AuthContext {
    const payload = verifyMockJwt(token, this.jwtSecret);
    const session = this.sessions.get(payload.sessionId);
    if (!session) throw new Error("Session not found.");
    const user = this.getUser(payload.sub);
    return { user, session };
  }

  requireRole(context: AuthContext, roles: readonly UserRole[]): void {
    if (!roles.includes(context.user.role)) {
      throw new Error("Insufficient role.");
    }
  }

  requireMerchantAccess(context: AuthContext, merchantId: string): void {
    if (context.user.role === "admin") return;
    if (context.user.merchantId !== merchantId) throw new Error("Merchant access denied.");
  }

  getUser(userId: string): User {
    const user = this.users.get(userId);
    if (!user) throw new Error(`User not found: ${userId}.`);
    return user;
  }
}
