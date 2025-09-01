import { User } from "../../entities";

export interface UserRepository {
  create(user: User): Promise<string>;
  findByUid(uid: string): Promise<User | null>;
  findById(userUid: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(uid: string): Promise<void>;
  findAll(): Promise<User[]>;
  findByRole(role: string): Promise<User[]>;
}
