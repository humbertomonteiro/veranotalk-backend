"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseTransactionRepository = void 0;
const firestore_1 = require("firebase/firestore");
const firebaseConfig_1 = require("../config/firebaseConfig");
const Transaction_1 = require("../../domain/entities/Transaction");
function removeUndefinedFields(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (Array.isArray(obj)) {
        return obj.map(removeUndefinedFields);
    }
    if (typeof obj === "object") {
        return Object.fromEntries(Object.entries(obj)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => [key, removeUndefinedFields(value)]));
    }
    return obj;
}
class FirebaseTransactionRepository {
    constructor() {
        this.collectionName = "transactions";
    }
    async create(transaction) {
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
                ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, transaction.id)
                : (0, firestore_1.doc)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
            await (0, firestore_1.setDoc)(docRef, cleanedDTO);
            console.log(`Transação criada com ID: ${docRef.id}`);
            return docRef.id;
        }
        catch (error) {
            console.error("Erro ao criar transação:", error);
            throw new Error("Erro ao criar transação");
        }
    }
    async findById(id) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (!docSnap.exists()) {
                console.log(`Transação não encontrada para ID: ${id}`);
                return null;
            }
            const data = docSnap.data();
            const date = data.date ? new Date(data.date) : new Date();
            const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
            if (isNaN(date.getTime()) ||
                isNaN(createdAt.getTime()) ||
                isNaN(updatedAt.getTime())) {
                console.error(`Datas inválidas no documento ${docSnap.id}:`, {
                    date: data.date,
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                });
                return new Transaction_1.Transaction({
                    ...data,
                    id: docSnap.id,
                    date: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            return new Transaction_1.Transaction({
                ...data,
                id: docSnap.id,
                date,
                createdAt,
                updatedAt,
            });
        }
        catch (error) {
            console.error(`Erro ao buscar transação por ID ${id}:`, error);
            throw new Error("Erro ao buscar transação por ID");
        }
    }
    async update(transaction) {
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
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, transaction.id);
            await (0, firestore_1.updateDoc)(docRef, cleanedDTO);
            console.log(`Transação atualizada com ID: ${transaction.id}`);
        }
        catch (error) {
            console.error(`Erro ao atualizar transação ${transaction.id}:`, error);
            throw new Error("Erro ao atualizar transação");
        }
    }
    async delete(id) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
            await (0, firestore_1.deleteDoc)(docRef);
            console.log(`Transação deletada com ID: ${id}`);
        }
        catch (error) {
            console.error(`Erro ao deletar transação ${id}:`, error);
            throw new Error("Erro ao deletar transação");
        }
    }
    async findAll() {
        try {
            const querySnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                const date = data.date ? new Date(data.date) : new Date();
                const createdAt = data.createdAt
                    ? new Date(data.createdAt)
                    : new Date();
                const updatedAt = data.updatedAt
                    ? new Date(data.updatedAt)
                    : new Date();
                if (isNaN(date.getTime()) ||
                    isNaN(createdAt.getTime()) ||
                    isNaN(updatedAt.getTime())) {
                    console.error(`Datas inválidas no documento ${doc.id}:`, {
                        date: data.date,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    return new Transaction_1.Transaction({
                        ...data,
                        id: doc.id,
                        date: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                return new Transaction_1.Transaction({
                    ...data,
                    id: doc.id,
                    date,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error("Erro ao buscar todas as transações:", error);
            throw new Error("Erro ao buscar transações");
        }
    }
    async findByCategory(category) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("category", "==", category));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                const date = data.date ? new Date(data.date) : new Date();
                const createdAt = data.createdAt
                    ? new Date(data.createdAt)
                    : new Date();
                const updatedAt = data.updatedAt
                    ? new Date(data.updatedAt)
                    : new Date();
                if (isNaN(date.getTime()) ||
                    isNaN(createdAt.getTime()) ||
                    isNaN(updatedAt.getTime())) {
                    console.error(`Datas inválidas no documento ${doc.id}:`, {
                        date: data.date,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    return new Transaction_1.Transaction({
                        ...data,
                        id: doc.id,
                        date: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                return new Transaction_1.Transaction({
                    ...data,
                    id: doc.id,
                    date,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error(`Erro ao buscar transações por categoria ${category}:`, error);
            throw new Error("Erro ao buscar transações por categoria");
        }
    }
    async findByPeriod(startDate, endDate) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("date", ">=", startDate.toISOString()), (0, firestore_1.where)("date", "<=", endDate.toISOString()));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                const date = data.date ? new Date(data.date) : new Date();
                const createdAt = data.createdAt
                    ? new Date(data.createdAt)
                    : new Date();
                const updatedAt = data.updatedAt
                    ? new Date(data.updatedAt)
                    : new Date();
                if (isNaN(date.getTime()) ||
                    isNaN(createdAt.getTime()) ||
                    isNaN(updatedAt.getTime())) {
                    console.error(`Datas inválidas no documento ${doc.id}:`, {
                        date: data.date,
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    return new Transaction_1.Transaction({
                        ...data,
                        id: doc.id,
                        date: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                return new Transaction_1.Transaction({
                    ...data,
                    id: doc.id,
                    date,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error(`Erro ao buscar transações no período ${startDate} a ${endDate}:`, error);
            throw new Error("Erro ao buscar transações por período");
        }
    }
}
exports.FirebaseTransactionRepository = FirebaseTransactionRepository;
//# sourceMappingURL=FirebaseTransactionRepository.js.map