import { Transaction, TransactionCategory } from "../entities/Transaction";

export interface CashFlowProps {
  transactions: Transaction[];
}

export class CashFlow {
  constructor(private readonly props: CashFlowProps) {}

  // Calcula o total de receitas
  getTotalDeposits(): number {
    return this.props.transactions
      .filter((t) => t.type === "deposit")
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Calcula o total de despesas
  getTotalExpenses(): number {
    return this.props.transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
  }

  // Calcula o balanço (receitas - despesas)
  getBalance(): number {
    return this.getTotalDeposits() - this.getTotalExpenses();
  }

  // Retorna transações por categoria
  getTransactionsByCategory(category: TransactionCategory): Transaction[] {
    return this.props.transactions.filter((t) => t.category === category);
  }

  // Calcula totais por categoria
  getTotalsByCategory(): Record<
    TransactionCategory,
    { deposits: number; expenses: number }
  > {
    const totals: Record<
      TransactionCategory,
      { deposits: number; expenses: number }
    > = {
      [TransactionCategory.Sponsor]: { deposits: 0, expenses: 0 },
      [TransactionCategory.Speaker]: { deposits: 0, expenses: 0 },
      [TransactionCategory.Marketing]: { deposits: 0, expenses: 0 },
      [TransactionCategory.Infrastructure]: { deposits: 0, expenses: 0 },
      [TransactionCategory.Collaborators]: { deposits: 0, expenses: 0 },
      [TransactionCategory.Other]: { deposits: 0, expenses: 0 },
    };

    for (const transaction of this.props.transactions) {
      if (transaction.type === "deposit") {
        totals[transaction.category].deposits += transaction.amount;
      } else {
        totals[transaction.category].expenses += transaction.amount;
      }
    }

    return totals;
  }

  // Adiciona uma nova transação
  addTransaction(transaction: Transaction): CashFlow {
    return new CashFlow({
      transactions: [...this.props.transactions, transaction],
    });
  }

  // Filtra transações por período
  getTransactionsByPeriod(startDate: Date, endDate: Date): Transaction[] {
    return this.props.transactions.filter(
      (t) => t.date >= startDate && t.date <= endDate
    );
  }

  // Calcula o balanço acumulado até uma data
  getBalanceUntil(date: Date): number {
    return this.props.transactions
      .filter((t) => t.date <= date)
      .reduce((sum, t) => sum + t.getImpact(), 0);
  }
}
