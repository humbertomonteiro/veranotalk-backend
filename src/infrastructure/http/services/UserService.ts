import { User, UserProps } from "../../../domain/entities";
import { UserRepository } from "../../../domain/interfaces/repositories";
import { auth } from "../../config/firebaseConfig";

import {
  DeactivateUserUseCase,
  ActivateUserUseCase,
  UpdateLastLoginUseCase,
} from "../../../domain/usecases";
import { createUserWithEmailAndPassword } from "firebase/auth";

export class UserService {
  private deactivateUserUseCase: DeactivateUserUseCase;
  private activateUserUseCase: ActivateUserUseCase;
  private updateLastLoginUseCase: UpdateLastLoginUseCase;

  constructor(private readonly userRepository: UserRepository) {
    this.deactivateUserUseCase = new DeactivateUserUseCase(userRepository);
    this.activateUserUseCase = new ActivateUserUseCase(userRepository);
    this.updateLastLoginUseCase = new UpdateLastLoginUseCase(userRepository);
  }

  async createUser(
    userData: Omit<UserProps, "id">,
    password: string
  ): Promise<User> {
    try {
      const newUser = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        password
      );
      const user = new User({ ...userData, uid: newUser.user.uid });
      const userId = await this.userRepository.create(user);
      return new User({ ...user.toDTO(), id: userId });
    } catch (err) {
      console.error("Erro ao criar usuário:", err);
      throw new Error("Failed to create user");
    }
  }

  async loginUser(uid: string) {
    try {
      const user = await this.getUserByUid(uid);

      if (user) {
        await this.updateLastLogin(user.uid!);
      }

      return user;
    } catch (err) {
      console.log("Erro ao logar:", err);
      throw new Error("Failed to authentication user");
    }
  }

  async getUserByUid(uid: string): Promise<User | null> {
    try {
      return await this.userRepository.findByUid(uid);
    } catch (err) {
      console.error(`Erro ao buscar usuário por UID ${uid}:`, err);
      throw new Error("Failed to fetch user");
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await this.userRepository.findByEmail(email);
    } catch (err) {
      console.error(`Erro ao buscar usuário por email ${email}:`, err);
      throw new Error("Failed to fetch user by email");
    }
  }

  async updateUser(uid: string, updates: Partial<UserProps>): Promise<User> {
    try {
      const user = await this.userRepository.findById(uid);
      if (!user) {
        throw new Error("User not found");
      }

      const updatedUserProps: UserProps = {
        ...user.toDTO(),
        ...updates,
        id: user.id,
        updatedAt: new Date(),
      };

      const updatedUser = new User(updatedUserProps);
      await this.userRepository.update(updatedUser);
      return updatedUser;
    } catch (err) {
      console.error(`Erro ao atualizar usuário ${uid}:`, err);
      throw new Error("Failed to update user");
    }
  }

  async deleteUser(uid: string): Promise<void> {
    try {
      await this.userRepository.delete(uid);
    } catch (err) {
      console.error(`Erro ao deletar usuário ${uid}:`, err);
      throw new Error("Failed to delete user");
    }
  }

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (err) {
      console.error("Erro ao buscar todos os usuários:", err);
      throw new Error("Failed to fetch users");
    }
  }

  async getUsersByRole(role: string): Promise<User[]> {
    try {
      return await this.userRepository.findByRole(role);
    } catch (err) {
      console.error(`Erro ao buscar usuários por role ${role}:`, err);
      throw new Error("Failed to fetch users by role");
    }
  }

  async deactivateUser(uid: string): Promise<void> {
    try {
      await this.deactivateUserUseCase.execute(uid);
    } catch (err) {
      console.error(`Erro ao desativar usuário ${uid}:`, err);
      throw new Error("Failed to deactivate user");
    }
  }

  async activateUser(uid: string): Promise<void> {
    try {
      await this.activateUserUseCase.execute(uid);
    } catch (err) {
      console.error(`Erro ao ativar usuário ${uid}:`, err);
      throw new Error("Failed to activate user");
    }
  }

  async updateLastLogin(uid: string): Promise<void> {
    try {
      await this.updateLastLoginUseCase.execute(uid);
    } catch (err) {
      console.error(`Erro ao atualizar lastLogin para usuário ${uid}:`, err);
      throw new Error("Failed to update last login");
    }
  }
}
