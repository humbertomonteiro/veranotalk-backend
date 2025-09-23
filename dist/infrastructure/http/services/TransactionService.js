"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionService = void 0;
const entities_1 = require("../../../domain/entities");
const Cashflow_1 = require("../../../domain/classes/Cashflow");
class TransactionService {
    constructor(transactionRepository) {
        this.transactionRepository = transactionRepository;
    }
    async createTransaction(data) {
        try {
            const transaction = new entities_1.Transaction({
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            const transactionId = await this.transactionRepository.create(transaction);
            return new entities_1.Transaction({ ...transaction.toDTO(), id: transactionId });
        }
        catch (error) {
            console.error("Erro ao criar transação:", error);
            throw new Error("Falha ao criar transação");
        }
    }
    async getTransactionById(id) {
        try {
            return await this.transactionRepository.findById(id);
        }
        catch (error) {
            console.error(`Erro ao buscar transação por ID ${id}:`, error);
            throw new Error("Falha ao buscar transação");
        }
    }
    async updateTransaction(id, updates) {
        try {
            const transaction = await this.transactionRepository.findById(id);
            if (!transaction) {
                throw new Error("Transação não encontrada");
            }
            const updatedProps = {
                ...transaction.toDTO(),
                ...updates,
                id: transaction.id,
                updatedAt: new Date(),
            };
            const updatedTransaction = new entities_1.Transaction(updatedProps);
            await this.transactionRepository.update(updatedTransaction);
            return updatedTransaction;
        }
        catch (error) {
            console.error(`Erro ao atualizar transação ${id}:`, error);
            throw new Error("Falha ao atualizar transação");
        }
    }
    async deleteTransaction(id) {
        try {
            await this.transactionRepository.delete(id);
        }
        catch (error) {
            console.error(`Erro ao deletar transação ${id}:`, error);
            throw new Error("Falha ao deletar transação");
        }
    }
    async getAllTransactions() {
        try {
            return await this.transactionRepository.findAll();
        }
        catch (error) {
            console.error("Erro ao buscar todas as transações:", error);
            throw new Error("Falha ao buscar transações");
        }
    }
    async getTransactionsByCategory(category) {
        try {
            return await this.transactionRepository.findByCategory(category);
        }
        catch (error) {
            console.error(`Erro ao buscar transações por categoria ${category}:`, error);
            throw new Error("Falha ao buscar transações por categoria");
        }
    }
    async getTransactionsByPeriod(startDate, endDate) {
        try {
            return await this.transactionRepository.findByPeriod(startDate, endDate);
        }
        catch (error) {
            console.error(`Erro ao buscar transações no período ${startDate} a ${endDate}:`, error);
            throw new Error("Falha ao buscar transações por período");
        }
    }
    async getCashFlowSummary() {
        try {
            const transactions = await this.transactionRepository.findAll();
            const cashFlow = new Cashflow_1.CashFlow({ transactions });
            return {
                totalDeposits: cashFlow.getTotalDeposits(),
                totalExpenses: cashFlow.getTotalExpenses(),
                balance: cashFlow.getBalance(),
                totalsByCategory: cashFlow.getTotalsByCategory(),
            };
        }
        catch (error) {
            console.error("Erro ao calcular resumo do fluxo de caixa:", error);
            throw new Error("Falha ao calcular resumo do fluxo de caixa");
        }
    }
    async getCashFlowByPeriod(startDate, endDate) {
        try {
            const transactions = await this.transactionRepository.findByPeriod(startDate, endDate);
            const cashFlow = new Cashflow_1.CashFlow({ transactions });
            return {
                totalDeposits: cashFlow.getTotalDeposits(),
                totalExpenses: cashFlow.getTotalExpenses(),
                balance: cashFlow.getBalance(),
                transactions,
            };
        }
        catch (error) {
            console.error(`Erro ao calcular fluxo de caixa no período ${startDate} a ${endDate}:`, error);
            throw new Error("Falha ao calcular fluxo de caixa por período");
        }
    }
}
exports.TransactionService = TransactionService;
//# sourceMappingURL=TransactionService.js.map