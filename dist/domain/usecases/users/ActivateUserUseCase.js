"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivateUserUseCase = void 0;
class ActivateUserUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(uid) {
        const user = await this.userRepository.findByUid(uid);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        user.activate();
        await this.userRepository.update(user);
    }
}
exports.ActivateUserUseCase = ActivateUserUseCase;
//# sourceMappingURL=ActivateUserUseCase.js.map