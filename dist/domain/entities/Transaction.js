"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Transaction = exports.TransactionCategory = void 0;
var TransactionCategory;
(function (TransactionCategory) {
    TransactionCategory["Sponsor"] = "SPONSOR";
    TransactionCategory["Speaker"] = "SPEAKER";
    TransactionCategory["Marketing"] = "MARKETING";
    TransactionCategory["Infrastructure"] = "INFRASTRUCTURE";
    TransactionCategory["Collaborators"] = "COLLABORATORS";
    TransactionCategory["Other"] = "OTHER";
})(TransactionCategory || (exports.TransactionCategory = TransactionCategory = {}));
class Transaction {
    constructor(props) {
        this.props = props;
        this.props = {
            ...props,
            createdAt: props.createdAt || new Date(),
            updatedAt: props.updatedAt || new Date(),
        };
        this.validate();
    }
    validate() {
        if (this.props.amount <= 0) {
            throw new Error("O valor da transação deve ser maior que zero.");
        }
        if (!["deposit", "expense"].includes(this.props.type)) {
            throw new Error("Tipo de transação inválido.");
        }
        if (!this.props.description || this.props.description.trim() === "") {
            throw new Error("A descrição não pode estar vazia.");
        }
        if (!this.props.category ||
            !Object.values(TransactionCategory).includes(this.props.category)) {
            throw new Error("Categoria não pode estar vazia ou inválida.");
        }
    }
    get id() {
        return this.props.id;
    }
    get amount() {
        return this.props.amount;
    }
    get type() {
        return this.props.type;
    }
    get description() {
        return this.props.description;
    }
    get category() {
        return this.props.category;
    }
    get userId() {
        return this.props.userId;
    }
    get date() {
        return this.props.date;
    }
    get createdAt() {
        return this.props.createdAt;
    }
    get updatedAt() {
        return this.props.updatedAt;
    }
    updateAmount(newAmount) {
        if (newAmount <= 0) {
            throw new Error("O valor da transação deve ser maior que zero.");
        }
        return new Transaction({
            ...this.props,
            amount: newAmount,
            updatedAt: new Date(),
        });
    }
    updateDescription(newDescription) {
        if (!newDescription || newDescription.trim() === "") {
            throw new Error("A descrição não pode estar vazia.");
        }
        return new Transaction({
            ...this.props,
            description: newDescription,
            updatedAt: new Date(),
        });
    }
    updateCategory(newCategory) {
        return new Transaction({
            ...this.props,
            category: newCategory,
            updatedAt: new Date(),
        });
    }
    getImpact() {
        return this.type === "deposit" ? this.amount : -this.amount;
    }
    toDTO() {
        return this.props;
    }
}
exports.Transaction = Transaction;
//# sourceMappingURL=Transaction.js.map