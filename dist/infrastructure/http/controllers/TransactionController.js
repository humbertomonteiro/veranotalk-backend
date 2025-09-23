"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const entities_1 = require("../../../domain/entities");
class TransactionController {
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    async createTransaction(req, res) {
        try {
            const { amount, type, description, category, date, userId } = req.body;
            if (!amount || !type || !description || !category || !date) {
                res.status(400).json({
                    error: "Campos obrigatórios: amount, type, description, category, date",
                });
                return;
            }
            if (!["deposit", "expense"].includes(type)) {
                res.status(400).json({ error: "Tipo inválido. Use: deposit, expense" });
                return;
            }
            if (!Object.values(entities_1.TransactionCategory).includes(category)) {
                res.status(400).json({
                    error: "Categoria inválida. Use: SPONSOR, SPEAKER, MARKETING, INFRASTRUCTURE, COLLABORATORS, OTHER",
                });
                return;
            }
            const parsedDate = new Date(date);
            if (isNaN(parsedDate.getTime())) {
                res.status(400).json({ error: "Data inválida" });
                return;
            }
            const transaction = await this.transactionService.createTransaction({
                amount,
                type,
                description,
                category,
                date: parsedDate,
                userId,
            });
            res.status(201).json(transaction.toDTO());
        }
        catch (error) {
            console.error("Erro ao criar transação:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao criar transação",
            });
        }
    }
    async getTransactionById(req, res) {
        try {
            const { id } = req.params;
            const transaction = await this.transactionService.getTransactionById(id);
            if (!transaction) {
                res.status(404).json({ error: "Transação não encontrada" });
                return;
            }
            res.status(200).json(transaction.toDTO());
        }
        catch (error) {
            console.error("Erro ao buscar transação:", error);
            res.status(500).json({
                error: error instanceof Error ? error.message : "Erro ao buscar transação",
            });
        }
    }
    async updateTransaction(req, res) {
        try {
            const { id } = req.params;
            const { amount, type, description, category, date, userId } = req.body;
            if (!amount && !type && !description && !category && !date && !userId) {
                res.status(400).json({
                    error: "Pelo menos um campo (amount, type, description, category, date, userId) deve ser fornecido",
                });
                return;
            }
            if (type && !["deposit", "expense"].includes(type)) {
                res.status(400).json({ error: "Tipo inválido. Use: deposit, expense" });
                return;
            }
            if (category && !Object.values(entities_1.TransactionCategory).includes(category)) {
                res.status(400).json({
                    error: "Categoria inválida. Use: SPONSOR, SPEAKER, MARKETING, INFRASTRUCTURE, COLLABORATORS, OTHER",
                });
                return;
            }
            if (date) {
                const parsedDate = new Date(date);
                if (isNaN(parsedDate.getTime())) {
                    res.status(400).json({ error: "Data inválida" });
                    return;
                }
            }
            const transaction = await this.transactionService.updateTransaction(id, {
                amount,
                type,
                description,
                category,
                date: date ? new Date(date) : undefined,
                userId,
            });
            res.status(200).json(transaction.toDTO());
        }
        catch (error) {
            console.error("Erro ao atualizar transação:", error);
            res.status(400).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao atualizar transação",
            });
        }
    }
    async deleteTransaction(req, res) {
        try {
            const { id } = req.params;
            await this.transactionService.deleteTransaction(id);
            res.status(200).json({ message: "Transação deletada com sucesso" });
        }
        catch (error) {
            console.error("Erro ao deletar transação:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao deletar transação",
            });
        }
    }
    async getAllTransactions(req, res) {
        try {
            const transactions = await this.transactionService.getAllTransactions();
            res
                .status(200)
                .json(transactions.map((transaction) => transaction.toDTO()));
        }
        catch (error) {
            console.error("Erro ao buscar todas as transações:", error);
            res.status(500).json({
                error: error instanceof Error ? error.message : "Erro ao buscar transações",
            });
        }
    }
    async getTransactionsByCategory(req, res) {
        try {
            const { category } = req.params;
            if (!Object.values(entities_1.TransactionCategory).includes(category)) {
                res.status(400).json({
                    error: "Categoria inválida. Use: SPONSOR, SPEAKER, MARKETING, INFRASTRUCTURE, COLLABORATORS, OTHER",
                });
                return;
            }
            const transactions = await this.transactionService.getTransactionsByCategory(category);
            res
                .status(200)
                .json(transactions.map((transaction) => transaction.toDTO()));
        }
        catch (error) {
            console.error("Erro ao buscar transações por categoria:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao buscar transações por categoria",
            });
        }
    }
    async getTransactionsByPeriod(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                res
                    .status(400)
                    .json({ error: "Campos obrigatórios: startDate, endDate" });
                return;
            }
            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                res.status(400).json({ error: "Datas inválidas" });
                return;
            }
            const transactions = await this.transactionService.getTransactionsByPeriod(parsedStartDate, parsedEndDate);
            res
                .status(200)
                .json(transactions.map((transaction) => transaction.toDTO()));
        }
        catch (error) {
            console.error("Erro ao buscar transações por período:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao buscar transações por período",
            });
        }
    }
    async getCashFlowSummary(req, res) {
        try {
            const summary = await this.transactionService.getCashFlowSummary();
            res.status(200).json(summary);
        }
        catch (error) {
            console.error("Erro ao calcular resumo do fluxo de caixa:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao calcular resumo do fluxo de caixa",
            });
        }
    }
    async getCashFlowByPeriod(req, res) {
        try {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                res
                    .status(400)
                    .json({ error: "Campos obrigatórios: startDate, endDate" });
                return;
            }
            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);
            if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
                res.status(400).json({ error: "Datas inválidas" });
                return;
            }
            const cashFlow = await this.transactionService.getCashFlowByPeriod(parsedStartDate, parsedEndDate);
            res.status(200).json({
                ...cashFlow,
                transactions: cashFlow.transactions.map((t) => t.toDTO()),
            });
        }
        catch (error) {
            console.error("Erro ao calcular fluxo de caixa por período:", error);
            res.status(500).json({
                error: error instanceof Error
                    ? error.message
                    : "Erro ao calcular fluxo de caixa por período",
            });
        }
    }
}
exports.TransactionController = TransactionController;
//# sourceMappingURL=TransactionController.js.map