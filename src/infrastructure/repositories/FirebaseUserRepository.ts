import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { User, UserProps } from "../../domain/entities";
import { UserRepository } from "../../domain/interfaces/repositories";

function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields);
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefinedFields(value)])
    );
  }
  return obj;
}

class FirebaseUserRepository implements UserRepository {
  private readonly collectionName = "users";

  async create(user: User): Promise<string> {
    try {
      const userDTO = user.toDTO();
      const cleanedDTO = removeUndefinedFields({
        ...userDTO,
        id: undefined,
        createdAt: userDTO.createdAt
          ? userDTO.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: userDTO.updatedAt
          ? userDTO.updatedAt.toISOString()
          : new Date().toISOString(),
        lastLogin: userDTO.lastLogin
          ? userDTO.lastLogin.toISOString()
          : undefined,
      });

      const docRef = user.id
        ? doc(db, this.collectionName, user.id)
        : doc(collection(db, this.collectionName));

      await setDoc(docRef, cleanedDTO);
      console.log(`Usuário criado com ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar usuário:", error);
      throw new Error("Error creating user");
    }
  }

  async findById(userUid: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.collectionName, userUid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log(`Usuário não encontrado para ID: ${userUid}`);
        return null;
      }

      const data = docSnap.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      const lastLogin = data.lastLogin ? new Date(data.lastLogin) : undefined;

      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Datas inválidas no documento ${docSnap.id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new User({
          ...data,
          id: docSnap.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin,
        } as UserProps);
      }

      return new User({
        ...data,
        id: docSnap.id,
        createdAt,
        updatedAt,
        lastLogin,
      } as UserProps);
    } catch (error) {
      console.error(`Erro ao buscar usuário por ID ${userUid}:`, error);
      throw new Error("Error fetching user by ID");
    }
  }

  async findByUid(uid: string): Promise<User | null> {
    try {
      // Cria uma query para buscar documentos onde o campo 'uid' é igual ao fornecido
      const q = query(
        collection(db, this.collectionName),
        where("uid", "==", uid)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`Usuário não encontrado para UID: ${uid}`);
        return null;
      }

      // Como o UID deve ser único, esperamos apenas um documento
      const docSnap = querySnapshot.docs[0];
      const data = docSnap.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      const lastLogin = data.lastLogin ? new Date(data.lastLogin) : undefined;

      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Datas inválidas no documento ${docSnap.id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new User({
          ...data,
          id: docSnap.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin,
        } as UserProps);
      }

      return new User({
        ...data,
        id: docSnap.id,
        createdAt,
        updatedAt,
        lastLogin,
      } as UserProps);
    } catch (error) {
      console.error(`Erro ao buscar usuário por UID ${uid}:`, error);
      throw new Error("Error fetching user");
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("email", "==", email)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log(`Usuário não encontrado para email: ${email}`);
        return null;
      }
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      const lastLogin = data.lastLogin ? new Date(data.lastLogin) : undefined;
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Datas inválidas no documento ${doc.id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new User({
          ...data,
          id: doc.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLogin,
        } as UserProps);
      }
      return new User({
        ...data,
        id: doc.id,
        createdAt,
        updatedAt,
        lastLogin,
      } as UserProps);
    } catch (error) {
      console.error(`Erro ao buscar usuário por email ${email}:`, error);
      throw new Error("Error fetching user");
    }
  }

  async update(user: User): Promise<void> {
    try {
      if (!user.id) throw new Error("User ID is required for update");
      const userDTO = user.toDTO();
      const cleanedDTO = removeUndefinedFields({
        ...userDTO,
        id: undefined,
        createdAt: userDTO.createdAt
          ? userDTO.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: userDTO.updatedAt
          ? userDTO.updatedAt.toISOString()
          : new Date().toISOString(),
        lastLogin: userDTO.lastLogin
          ? userDTO.lastLogin.toISOString()
          : undefined,
      });
      const docRef = doc(db, this.collectionName, user.id);
      await updateDoc(docRef, cleanedDTO);
      console.log(`Usuário atualizado com ID: ${user.id}`);
    } catch (error) {
      console.error(`Erro ao atualizar usuário ${user.id}:`, error);
      throw new Error("Error updating user");
    }
  }

  async delete(uid: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, uid);
      await deleteDoc(docRef);
      console.log(`Usuário deletado com UID: ${uid}`);
    } catch (error) {
      console.error(`Erro ao deletar usuário ${uid}:`, error);
      throw new Error("Error deleting user");
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt
          ? new Date(data.createdAt)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt)
          : new Date();
        const lastLogin = data.lastLogin ? new Date(data.lastLogin) : undefined;
        if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
          console.error(`Datas inválidas no documento ${doc.id}:`, {
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new User({
            ...data,
            id: doc.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin,
          } as UserProps);
        }
        return new User({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
          lastLogin,
        } as UserProps);
      });
    } catch (error) {
      console.error("Erro ao buscar todos os usuários:", error);
      throw new Error("Error fetching users");
    }
  }

  async findByRole(role: string): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("role", "==", role)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const createdAt = data.createdAt
          ? new Date(data.createdAt)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt)
          : new Date();
        const lastLogin = data.lastLogin ? new Date(data.lastLogin) : undefined;
        if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
          console.error(`Datas inválidas no documento ${doc.id}:`, {
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new User({
            ...data,
            id: doc.id,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastLogin,
          } as UserProps);
        }
        return new User({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
          lastLogin,
        } as UserProps);
      });
    } catch (error) {
      console.error(`Erro ao buscar usuários por role ${role}:`, error);
      throw new Error("Error fetching users by role");
    }
  }
}

export { UserRepository, FirebaseUserRepository };
