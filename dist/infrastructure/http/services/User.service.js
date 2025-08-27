"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
// backend/src/infrastructure/http/services/UserService.ts
const entities_1 = require("../../../domain/entities");
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async createUser(userData) {
        const user = new entities_1.User(userData);
        const userId = await this.userRepository.create(user);
        return new entities_1.User({ ...user.toDTO(), id: userId });
    }
    async getUserByUid(uid) {
        return this.userRepository.findByUid(uid);
    }
    async updateUser(uid, updates) {
        const user = await this.userRepository.findByUid(uid);
        if (!user) {
            throw new Error("Usuário não encontrado");
        }
        const updatedUser = new entities_1.User({
            ...user.toDTO(),
            ...updates,
            updatedAt: new Date(),
        });
        await this.userRepository.update(updatedUser);
        return updatedUser;
    }
    async getAllUsers() {
        return this.userRepository.findAll();
    }
}
exports.UserService = UserService;
//# sourceMappingURL=User.service.js.map