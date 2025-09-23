"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateLastLoginUseCase = void 0;
// import { User } from "../../../domain/entities";
class UpdateLastLoginUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(uid) {
        const user = await this.userRepository.findByUid(uid);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        user.updateLastLogin();
        await this.userRepository.update(user);
    }
}
exports.UpdateLastLoginUseCase = UpdateLastLoginUseCase;
//# sourceMappingURL=UpdateLastLoginUseCase.js.map