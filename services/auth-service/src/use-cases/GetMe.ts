import type { IUserRepository } from "../domain/ports/UserRepository.js";
import { toPublic } from "../domain/entities/User.js";

export class GetMe {
  constructor(private readonly userRepo: IUserRepository) {}

  async execute(userId: string): Promise<ReturnType<typeof toPublic>> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }
    if (user.suspendedAt) {
      throw new Error("ACCOUNT_SUSPENDED");
    }
    return toPublic(user);
  }
}
