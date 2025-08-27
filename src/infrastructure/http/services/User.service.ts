// backend/src/infrastructure/http/services/UserService.ts
import { User, UserProps } from "../../../domain/entities";
import { UserRepository } from "../../../domain/interfaces/repositories";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(userData: Omit<UserProps, "id">): Promise<User> {
    const user = new User(userData);
    const userId = await this.userRepository.create(user);
    return new User({ ...user.toDTO(), id: userId });
  }

  async getUserByUid(uid: string): Promise<User | null> {
    return this.userRepository.findByUid(uid);
  }

  async updateUser(uid: string, updates: Partial<UserProps>): Promise<User> {
    const user = await this.userRepository.findByUid(uid);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const updatedUser = new User({
      ...user.toDTO(),
      ...updates,
      updatedAt: new Date(),
    });

    await this.userRepository.update(updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }
}
