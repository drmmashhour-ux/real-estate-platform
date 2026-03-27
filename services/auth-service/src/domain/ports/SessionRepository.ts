import type { SessionEntity } from "../entities/Session.js";

export interface ISessionRepository {
  create(userId: string, tokenHash: string, expiresAt: Date): Promise<SessionEntity>;
  findByTokenHash(tokenHash: string): Promise<SessionEntity | null>;
  deleteByTokenHash(tokenHash: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
