export type UserRole = "admin" | "merchant";

export interface User {
  id: string;
  email: string;
  role: UserRole;
  merchantId?: string;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface AuthContext {
  user: User;
  session: Session;
}
