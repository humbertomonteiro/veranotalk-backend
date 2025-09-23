"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashFlow = void 0;
const Transaction_1 = require("../entities/Transaction");
class CashFlow {
    constructor(props) {
        this.props = props;
    }
    // Calcula o total de receitas
    getTotalDeposits() {
        return this.props.transactions
            .filter((t) => t.type === "deposit")
            .reduce((sum, t) => sum + t.amount, 0);
    }
    // Calcula o total de despesas
    getTotalExpenses() {
        return this.props.transactions
            .filter((t) => t.type === "expense")
            .reduce((sum, t) => sum + t.amount, 0);
    }
    // Calcula o balanço (receitas - despesas)
    getBalance() {
        return this.getTotalDeposits() - this.getTotalExpenses();
    }
    // Retorna transações por categoria
    getTransactionsByCategory(category) {
        return this.props.transactions.filter((t) => t.category === category);
    }
    // Calcula totais por categoria
    getTotalsByCategory() {
        const totals = {
            [Transaction_1.TransactionCategory.Sponsor]: { deposits: 0, expenses: 0 },
            [Transaction_1.TransactionCategory.Speaker]: { deposits: 0, expenses: 0 },
            [Transaction_1.TransactionCategory.Marketing]: { deposits: 0, expenses: 0 },
            [Transaction_1.TransactionCategory.Infrastructure]: { deposits: 0, expenses: 0 },
            [Transaction_1.TransactionCategory.Collaborators]: { deposits: 0, expenses: 0 },
            [Transaction_1.TransactionCategory.Other]: { deposits: 0, expenses: 0 },
        };
        for (const transaction of this.props.transactions) {
            if (transaction.type === "deposit") {
                totals[transaction.category].deposits += transaction.amount;
            }
            else {
                totals[transaction.category].expenses += transaction.amount;
            }
        }
        return totals;
    }
    // Adiciona uma nova transação
    addTransaction(transaction) {
        return new CashFlow({
            transactions: [...this.props.transactions, transaction],
        });
    }
    // Filtra transações por período
    getTransactionsByPeriod(startDate, endDate) {
        return this.props.transactions.filter((t) => t.date >= startDate && t.date <= endDate);
    }
    // Calcula o balanço acumulado até uma data
    getBalanceUntil(date) {
        return this.props.transactions
            .filter((t) => t.date <= date)
            .reduce((sum, t) => sum + t.getImpact(), 0);
    }
}
exports.CashFlow = CashFlow;
//# sourceMappingURL=Cashflow.js.map