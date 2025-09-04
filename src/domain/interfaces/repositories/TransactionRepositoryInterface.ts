import { Transaction } from "../../entities/Transaction";

export interface TransactionRepository {
  create(transaction: Transaction): Promise<string>;
  findById(id: string): Promise<Transaction | null>;
  update(transaction: Transaction): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Transaction[]>;
  findByCategory(category: string): Promise<Transaction[]>;
  findByPeriod(startDate: Date, endDate: Date): Promise<Transaction[]>;
}
