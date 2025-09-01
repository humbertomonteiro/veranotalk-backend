import { UserRepository } from "../../../domain/interfaces/repositories";
// import { User } from "../../../domain/entities";

export class UpdateLastLoginUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string): Promise<void> {
    const user = await this.userRepository.findByUid(uid);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    user.updateLastLogin();
    await this.userRepository.update(user);
  }
}
