"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
class UserController {
    constructor(userService) {
        this.userService = userService;
    }
    async createUser(req, res) {
        try {
            const { email, password, name, role, permissions, isActive } = req.body;
            if (!email || !password || !name || !role) {
                res
                    .status(400)
                    .json({ error: "Campos obrigatórios: email, password, name, role" });
                return;
            }
            const user = await this.userService.createUser({
                email,
                name,
                role,
                permissions: permissions || [],
                isActive: isActive ?? true,
            }, password);
            res.status(201).json(user.toDTO());
        }
        catch (error) {
            console.error("Erro ao criar usuário:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao criar usuário",
            });
        }
    }
    async loginUser(req, res) {
        try {
            const { uid } = req.body;
            if (!uid) {
                res.status(400).json({ error: "Campos obrigatórios: uid" });
                return;
            }
            const user = await this.userService.loginUser(uid);
            if (!user) {
                res.status(400).json({ error: "User not found" });
                return;
            }
            res.status(201).json(user.toDTO());
        }
        catch (error) {
            console.error("Erro ao logar usuário:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao logar usuário",
            });
        }
    }
    async getUserByUid(req, res) {
        try {
            const { uid } = req.params;
            const user = await this.userService.getUserByUid(uid);
            if (!user) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
            res.status(200).json(user.toDTO());
        }
        catch (error) {
            console.error("Erro ao buscar usuário:", error);
            res.status(500).json({
                error: error instanceof Error ? error.message : "Erro ao buscar usuário",
            });
        }
    }
    async getUserByEmail(req, res) {
        try {
            const { email } = req.params;
            const user = await this.userService.getUserByEmail(email);
            if (!user) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
            res.status(200).json(user.toDTO());
        }
        catch (error) {
            console.error("Erro ao buscar usuário por email:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao buscar usuário por email",
            });
        }
    }
    async getCurrentUser(req, res) {
        try {
            const uid = req.user?.uid;
            if (!uid) {
                res.status(401).json({ error: "Usuário não autenticado" });
                return;
            }
            const user = await this.userService.getUserByUid(uid);
            if (!user) {
                res.status(404).json({ error: "Usuário não encontrado" });
                return;
            }
            res.status(200).json(user.toDTO());
        }
        catch (error) {
            console.error("Erro ao buscar usuário atual:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao buscar usuário atual",
            });
        }
    }
    async updateUser(req, res) {
        try {
            const { uid } = req.params;
            const { name, role, permissions, isActive, transfers } = req.body;
            if (!name && !role && !permissions && !isActive) {
                res.status(400).json({
                    error: "Pelo menos um campo (name, role, permissions, isActive) deve ser fornecido",
                });
                return;
            }
            const user = await this.userService.updateUser(uid, {
                name,
                role,
                permissions,
                isActive,
                transfers,
            });
            res.status(200).json("update success");
        }
        catch (error) {
            console.error("Erro ao atualizar usuário:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao atualizar usuário",
            });
        }
    }
    async deleteUser(req, res) {
        try {
            const { uid } = req.params;
            await this.userService.deleteUser(uid);
            res.status(200).json({ message: "Usuário deletado com sucesso" });
        }
        catch (error) {
            console.error("Erro ao deletar usuário:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao deletar usuário",
            });
        }
    }
    async getAllUsers(req, res) {
        try {
            const users = await this.userService.getAllUsers();
            res.status(200).json(users.map((user) => user.toDTO()));
        }
        catch (error) {
            console.error("Erro ao buscar todos os usuários:", error);
            res.status(500).json({
                error: error instanceof Error ? error.message : "Erro ao buscar usuários",
            });
        }
    }
    async getUsersByRole(req, res) {
        try {
            const { role } = req.params;
            if (!["admin", "staff", "viewer"].includes(role)) {
                res
                    .status(400)
                    .json({ error: "Role inválido. Use: admin, staff, viewer" });
                return;
            }
            const users = await this.userService.getUsersByRole(role);
            res.status(200).json(users.map((user) => user.toDTO()));
        }
        catch (error) {
            console.error("Erro ao buscar usuários por role:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao buscar usuários por role",
            });
        }
    }
    async deactivateUser(req, res) {
        try {
            const { uid } = req.params;
            await this.userService.deactivateUser(uid);
            res.status(200).json({ message: "Usuário desativado com sucesso" });
        }
        catch (error) {
            console.error("Erro ao desativar usuário:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao desativar usuário",
            });
        }
    }
    async activateUser(req, res) {
        try {
            const { uid } = req.params;
            await this.userService.activateUser(uid);
            res.status(200).json({ message: "Usuário ativado com sucesso" });
        }
        catch (error) {
            console.error("Erro ao ativar usuário:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao ativar usuário",
            });
        }
    }
    async updateLastLogin(req, res) {
        try {
            const { uid } = req.params;
            await this.userService.updateLastLogin(uid);
            res.status(200).json({ message: "Último login atualizado com sucesso" });
        }
        catch (error) {
            console.error("Erro ao atualizar lastLogin:", error);
            res.status(400).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao atualizar último login",
            });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=UserController.js.map