"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const entities_1 = require("../../../domain/entities");
const firebaseConfig_1 = require("../../config/firebaseConfig");
const usecases_1 = require("../../../domain/usecases");
const auth_1 = require("firebase/auth");
class UserService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.deactivateUserUseCase = new usecases_1.DeactivateUserUseCase(userRepository);
        this.activateUserUseCase = new usecases_1.ActivateUserUseCase(userRepository);
        this.updateLastLoginUseCase = new usecases_1.UpdateLastLoginUseCase(userRepository);
    }
    async createUser(userData, password) {
        try {
            const newUser = await (0, auth_1.createUserWithEmailAndPassword)(firebaseConfig_1.auth, userData.email, password);
            const user = new entities_1.User({ ...userData, uid: newUser.user.uid });
            const userId = await this.userRepository.create(user);
            return new entities_1.User({ ...user.toDTO(), id: userId });
        }
        catch (err) {
            console.error("Erro ao criar usuário:", err);
            throw new Error("Failed to create user");
        }
    }
    async loginUser(uid) {
        try {
            const user = await this.getUserByUid(uid);
            if (user) {
                await this.updateLastLogin(user.uid);
            }
            return user;
        }
        catch (err) {
            console.log("Erro ao logar:", err);
            throw new Error("Failed to authentication user");
        }
    }
    async getUserByUid(uid) {
        try {
            return await this.userRepository.findByUid(uid);
        }
        catch (err) {
            console.error(`Erro ao buscar usuário por UID ${uid}:`, err);
            throw new Error("Failed to fetch user");
        }
    }
    async getUserByEmail(email) {
        try {
            return await this.userRepository.findByEmail(email);
        }
        catch (err) {
            console.error(`Erro ao buscar usuário por email ${email}:`, err);
            throw new Error("Failed to fetch user by email");
        }
    }
    async updateUser(uid, updates) {
        try {
            const user = await this.userRepository.findById(uid);
            if (!user) {
                throw new Error("User not found");
            }
            const updatedUserProps = {
                ...user.toDTO(),
                ...updates,
                id: user.id,
                updatedAt: new Date(),
            };
            const updatedUser = new entities_1.User(updatedUserProps);
            await this.userRepository.update(updatedUser);
            return updatedUser;
        }
        catch (err) {
            console.error(`Erro ao atualizar usuário ${uid}:`, err);
            throw new Error("Failed to update user");
        }
    }
    async deleteUser(uid) {
        try {
            await this.userRepository.delete(uid);
        }
        catch (err) {
            console.error(`Erro ao deletar usuário ${uid}:`, err);
            throw new Error("Failed to delete user");
        }
    }
    async getAllUsers() {
        try {
            return await this.userRepository.findAll();
        }
        catch (err) {
            console.error("Erro ao buscar todos os usuários:", err);
            throw new Error("Failed to fetch users");
        }
    }
    async getUsersByRole(role) {
        try {
            return await this.userRepository.findByRole(role);
        }
        catch (err) {
            console.error(`Erro ao buscar usuários por role ${role}:`, err);
            throw new Error("Failed to fetch users by role");
        }
    }
    async deactivateUser(uid) {
        try {
            await this.deactivateUserUseCase.execute(uid);
        }
        catch (err) {
            console.error(`Erro ao desativar usuário ${uid}:`, err);
            throw new Error("Failed to deactivate user");
        }
    }
    async activateUser(uid) {
        try {
            await this.activateUserUseCase.execute(uid);
        }
        catch (err) {
            console.error(`Erro ao ativar usuário ${uid}:`, err);
            throw new Error("Failed to activate user");
        }
    }
    async updateLastLogin(uid) {
        try {
            await this.updateLastLoginUseCase.execute(uid);
        }
        catch (err) {
            console.error(`Erro ao atualizar lastLogin para usuário ${uid}:`, err);
            throw new Error("Failed to update last login");
        }
    }
}
exports.UserService = UserService;
//# sourceMappingURL=UserService.js.map