import { UserRepository } from "../../../domain/interfaces/repositories";

export class ActivateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(uid: string): Promise<void> {
    const user = await this.userRepository.findByUid(uid);
    if (!user) {
      throw new Error("Usuário não encontrado");
    }
    user.activate();
    await this.userRepository.update(user);
  }
}
