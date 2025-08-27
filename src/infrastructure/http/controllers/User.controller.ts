// backend/src/infrastructure/http/controllers/UserController.ts
import { Request, Response } from "express";
import { UserService } from "../../http/services";

export class UserController {
  constructor(private readonly userService: UserService) {}

  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { uid, email, name, role, permissions } = req.body;

      const user = await this.userService.createUser({
        uid,
        email,
        name,
        role,
        permissions,
        isActive: true,
      });

      res.status(201).json(user.toDTO());
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro ao criar usuário",
      });
    }
  }

  async getUserByUid(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const user = await this.userService.getUserByUid(uid);

      if (!user) {
        res.status(404).json({ error: "Usuário não encontrado" });
        return;
      }

      res.status(200).json(user.toDTO());
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Erro ao buscar usuário",
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // O middleware de autenticação deve adicionar o uid no request
      const uid = (req as any).user?.uid;

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
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Erro ao buscar usuário",
      });
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const updates = req.body;

      const user = await this.userService.updateUser(uid, updates);
      res.status(200).json(user.toDTO());
    } catch (error) {
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao atualizar usuário",
      });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.userService.getAllUsers();
      res.status(200).json(users.map((user) => user.toDTO()));
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Erro ao buscar usuários",
      });
    }
  }
}
