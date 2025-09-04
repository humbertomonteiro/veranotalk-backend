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
import {
  Transaction,
  TransactionProps,
  TransactionCategory,
} from "../../domain/entities/Transaction";
import { TransactionRepository } from "../../domain/interfaces/repositories/TransactionRepositoryInterface";

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

class FirebaseTransactionRepository implements TransactionRepository {
  private readonly collectionName = "transactions";

  async create(transaction: Transaction): Promise<string> {
    try {
      const transactionDTO = transaction.toDTO();
      const cleanedDTO = removeUndefinedFields({
        ...transactionDTO,
        id: undefined, // Remove o ID para o Firestore gerar automaticamente
        date: transactionDTO.date.toISOString(),
        createdAt: transactionDTO.createdAt
          ? transactionDTO.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: transactionDTO.updatedAt
          ? transactionDTO.updatedAt.toISOString()
          : new Date().toISOString(),
      });

      const docRef = transaction.id
        ? doc(db, this.collectionName, transaction.id)
        : doc(collection(db, this.collectionName));

      await setDoc(docRef, cleanedDTO);
      console.log(`Transação criada com ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      throw new Error("Erro ao criar transação");
    }
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log(`Transação não encontrada para ID: ${id}`);
        return null;
      }

      const data = docSnap.data();
      const date = data.date ? new Date(data.date) : new Date();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();

      if (
        isNaN(date.getTime()) ||
        isNaN(createdAt.getTime()) ||
        isNaN(updatedAt.getTime())
      ) {
        console.error(`Datas inválidas no documento ${docSnap.id}:`, {
          date: data.date,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new Transaction({
          ...data,
          id: docSnap.id,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as TransactionProps);
      }

      return new Transaction({
        ...data,
        id: docSnap.id,
        date,
        createdAt,
        updatedAt,
      } as TransactionProps);
    } catch (error) {
      console.error(`Erro ao buscar transação por ID ${id}:`, error);
      throw new Error("Erro ao buscar transação por ID");
    }
  }

  async update(transaction: Transaction): Promise<void> {
    try {
      if (!transaction.id)
        throw new Error("O ID da transação é obrigatório para atualização");
      const transactionDTO = transaction.toDTO();
      const cleanedDTO = removeUndefinedFields({
        ...transactionDTO,
        id: undefined,
        date: transactionDTO.date.toISOString(),
        createdAt: transactionDTO.createdAt
          ? transactionDTO.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: transactionDTO.updatedAt
          ? transactionDTO.updatedAt.toISOString()
          : new Date().toISOString(),
      });

      const docRef = doc(db, this.collectionName, transaction.id);
      await updateDoc(docRef, cleanedDTO);
      console.log(`Transação atualizada com ID: ${transaction.id}`);
    } catch (error) {
      console.error(`Erro ao atualizar transação ${transaction.id}:`, error);
      throw new Error("Erro ao atualizar transação");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
      console.log(`Transação deletada com ID: ${id}`);
    } catch (error) {
      console.error(`Erro ao deletar transação ${id}:`, error);
      throw new Error("Erro ao deletar transação");
    }
  }

  async findAll(): Promise<Transaction[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date ? new Date(data.date) : new Date();
        const createdAt = data.createdAt
          ? new Date(data.createdAt)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt)
          : new Date();

        if (
          isNaN(date.getTime()) ||
          isNaN(createdAt.getTime()) ||
          isNaN(updatedAt.getTime())
        ) {
          console.error(`Datas inválidas no documento ${doc.id}:`, {
            date: data.date,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new Transaction({
            ...data,
            id: doc.id,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TransactionProps);
        }

        return new Transaction({
          ...data,
          id: doc.id,
          date,
          createdAt,
          updatedAt,
        } as TransactionProps);
      });
    } catch (error) {
      console.error("Erro ao buscar todas as transações:", error);
      throw new Error("Erro ao buscar transações");
    }
  }

  async findByCategory(category: TransactionCategory): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("category", "==", category)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date ? new Date(data.date) : new Date();
        const createdAt = data.createdAt
          ? new Date(data.createdAt)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt)
          : new Date();

        if (
          isNaN(date.getTime()) ||
          isNaN(createdAt.getTime()) ||
          isNaN(updatedAt.getTime())
        ) {
          console.error(`Datas inválidas no documento ${doc.id}:`, {
            date: data.date,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new Transaction({
            ...data,
            id: doc.id,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TransactionProps);
        }

        return new Transaction({
          ...data,
          id: doc.id,
          date,
          createdAt,
          updatedAt,
        } as TransactionProps);
      });
    } catch (error) {
      console.error(
        `Erro ao buscar transações por categoria ${category}:`,
        error
      );
      throw new Error("Erro ao buscar transações por categoria");
    }
  }

  async findByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("date", ">=", startDate.toISOString()),
        where("date", "<=", endDate.toISOString())
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => {
        const data = doc.data();
        const date = data.date ? new Date(data.date) : new Date();
        const createdAt = data.createdAt
          ? new Date(data.createdAt)
          : new Date();
        const updatedAt = data.updatedAt
          ? new Date(data.updatedAt)
          : new Date();

        if (
          isNaN(date.getTime()) ||
          isNaN(createdAt.getTime()) ||
          isNaN(updatedAt.getTime())
        ) {
          console.error(`Datas inválidas no documento ${doc.id}:`, {
            date: data.date,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new Transaction({
            ...data,
            id: doc.id,
            date: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          } as TransactionProps);
        }

        return new Transaction({
          ...data,
          id: doc.id,
          date,
          createdAt,
          updatedAt,
        } as TransactionProps);
      });
    } catch (error) {
      console.error(
        `Erro ao buscar transações no período ${startDate} a ${endDate}:`,
        error
      );
      throw new Error("Erro ao buscar transações por período");
    }
  }
}

export { TransactionRepository, FirebaseTransactionRepository };
