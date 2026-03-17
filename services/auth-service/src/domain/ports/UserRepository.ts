import type { UserEntity } from "../entities/User.js";
import type { Role } from "../enums/Role.js";

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  name?: string | null;
  phone?: string | null;
  locale?: string | null;
  roles?: Role[];
}

export interface IUserRepository {
  create(data: CreateUserInput): Promise<UserEntity>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  updateLastLoginAt(userId: string, at: Date): Promise<void>;
}
