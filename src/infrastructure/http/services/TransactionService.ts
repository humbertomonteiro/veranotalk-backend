import {
  Transaction,
  TransactionProps,
  TransactionCategory,
} from "../../../domain/entities";
import { CashFlow } from "../../../domain/classes/Cashflow";
import { TransactionRepository } from "../../../domain/interfaces/repositories";

export class TransactionService {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async createTransaction(
    data: Omit<TransactionProps, "id" | "createdAt" | "updatedAt">
  ): Promise<Transaction> {
    try {
      const transaction = new Transaction({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const transactionId = await this.transactionRepository.create(
        transaction
      );
      return new Transaction({ ...transaction.toDTO(), id: transactionId });
    } catch (error) {
      console.error("Erro ao criar transação:", error);
      throw new Error("Falha ao criar transação");
    }
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    try {
      return await this.transactionRepository.findById(id);
    } catch (error) {
      console.error(`Erro ao buscar transação por ID ${id}:`, error);
      throw new Error("Falha ao buscar transação");
    }
  }

  async updateTransaction(
    id: string,
    updates: Partial<Omit<TransactionProps, "id" | "createdAt" | "updatedAt">>
  ): Promise<Transaction> {
    try {
      const transaction = await this.transactionRepository.findById(id);
      if (!transaction) {
        throw new Error("Transação não encontrada");
      }

      const updatedProps: TransactionProps = {
        ...transaction.toDTO(),
        ...updates,
        id: transaction.id,
        updatedAt: new Date(),
      };

      const updatedTransaction = new Transaction(updatedProps);
      await this.transactionRepository.update(updatedTransaction);
      return updatedTransaction;
    } catch (error) {
      console.error(`Erro ao atualizar transação ${id}:`, error);
      throw new Error("Falha ao atualizar transação");
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    try {
      await this.transactionRepository.delete(id);
    } catch (error) {
      console.error(`Erro ao deletar transação ${id}:`, error);
      throw new Error("Falha ao deletar transação");
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.findAll();
    } catch (error) {
      console.error("Erro ao buscar todas as transações:", error);
      throw new Error("Falha ao buscar transações");
    }
  }

  async getTransactionsByCategory(
    category: TransactionCategory
  ): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.findByCategory(category);
    } catch (error) {
      console.error(
        `Erro ao buscar transações por categoria ${category}:`,
        error
      );
      throw new Error("Falha ao buscar transações por categoria");
    }
  }

  async getTransactionsByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    try {
      return await this.transactionRepository.findByPeriod(startDate, endDate);
    } catch (error) {
      console.error(
        `Erro ao buscar transações no período ${startDate} a ${endDate}:`,
        error
      );
      throw new Error("Falha ao buscar transações por período");
    }
  }

  async getCashFlowSummary(): Promise<{
    totalDeposits: number;
    totalExpenses: number;
    balance: number;
    totalsByCategory: Record<
      TransactionCategory,
      { deposits: number; expenses: number }
    >;
  }> {
    try {
      const transactions = await this.transactionRepository.findAll();
      const cashFlow = new CashFlow({ transactions });

      return {
        totalDeposits: cashFlow.getTotalDeposits(),
        totalExpenses: cashFlow.getTotalExpenses(),
        balance: cashFlow.getBalance(),
        totalsByCategory: cashFlow.getTotalsByCategory(),
      };
    } catch (error) {
      console.error("Erro ao calcular resumo do fluxo de caixa:", error);
      throw new Error("Falha ao calcular resumo do fluxo de caixa");
    }
  }

  async getCashFlowByPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<{
    totalDeposits: number;
    totalExpenses: number;
    balance: number;
    transactions: Transaction[];
  }> {
    try {
      const transactions = await this.transactionRepository.findByPeriod(
        startDate,
        endDate
      );
      const cashFlow = new CashFlow({ transactions });

      return {
        totalDeposits: cashFlow.getTotalDeposits(),
        totalExpenses: cashFlow.getTotalExpenses(),
        balance: cashFlow.getBalance(),
        transactions,
      };
    } catch (error) {
      console.error(
        `Erro ao calcular fluxo de caixa no período ${startDate} a ${endDate}:`,
        error
      );
      throw new Error("Falha ao calcular fluxo de caixa por período");
    }
  }
}
