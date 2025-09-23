"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeactivateUserUseCase = void 0;
class DeactivateUserUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(uid) {
        const user = await this.userRepository.findByUid(uid);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        user.deactivate();
        await this.userRepository.update(user);
    }
}
exports.DeactivateUserUseCase = DeactivateUserUseCase;
//# sourceMappingURL=DeactivateUserUseCase.js.map