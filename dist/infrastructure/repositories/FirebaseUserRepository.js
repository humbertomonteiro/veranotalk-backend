"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseUserRepository = void 0;
const firestore_1 = require("firebase/firestore");
const firebaseConfig_1 = require("../config/firebaseConfig");
const entities_1 = require("../../domain/entities");
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
class FirebaseUserRepository {
    constructor() {
        this.collectionName = "users";
    }
    async create(user) {
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
                ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, user.id)
                : (0, firestore_1.doc)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
            await (0, firestore_1.setDoc)(docRef, cleanedDTO);
            console.log(`Usuário criado com ID: ${docRef.id}`);
            return docRef.id;
        }
        catch (error) {
            console.error("Erro ao criar usuário:", error);
            throw new Error("Error creating user");
        }
    }
    async findById(userUid) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, userUid);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
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
                return new entities_1.User({
                    ...data,
                    id: docSnap.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin,
                });
            }
            return new entities_1.User({
                ...data,
                id: docSnap.id,
                createdAt,
                updatedAt,
                lastLogin,
            });
        }
        catch (error) {
            console.error(`Erro ao buscar usuário por ID ${userUid}:`, error);
            throw new Error("Error fetching user by ID");
        }
    }
    async findByUid(uid) {
        try {
            // Cria uma query para buscar documentos onde o campo 'uid' é igual ao fornecido
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("uid", "==", uid));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
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
                return new entities_1.User({
                    ...data,
                    id: docSnap.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin,
                });
            }
            return new entities_1.User({
                ...data,
                id: docSnap.id,
                createdAt,
                updatedAt,
                lastLogin,
            });
        }
        catch (error) {
            console.error(`Erro ao buscar usuário por UID ${uid}:`, error);
            throw new Error("Error fetching user");
        }
    }
    async findByEmail(email) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("email", "==", email));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
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
                return new entities_1.User({
                    ...data,
                    id: doc.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    lastLogin,
                });
            }
            return new entities_1.User({
                ...data,
                id: doc.id,
                createdAt,
                updatedAt,
                lastLogin,
            });
        }
        catch (error) {
            console.error(`Erro ao buscar usuário por email ${email}:`, error);
            throw new Error("Error fetching user");
        }
    }
    async update(user) {
        try {
            if (!user.id)
                throw new Error("User ID is required for update");
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
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, user.id);
            await (0, firestore_1.updateDoc)(docRef, cleanedDTO);
            console.log(`Usuário atualizado com ID: ${user.id}`);
        }
        catch (error) {
            console.error(`Erro ao atualizar usuário ${user.id}:`, error);
            throw new Error("Error updating user");
        }
    }
    async delete(uid) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, uid);
            await (0, firestore_1.deleteDoc)(docRef);
            console.log(`Usuário deletado com UID: ${uid}`);
        }
        catch (error) {
            console.error(`Erro ao deletar usuário ${uid}:`, error);
            throw new Error("Error deleting user");
        }
    }
    async findAll() {
        try {
            const querySnapshot = await (0, firestore_1.getDocs)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
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
                    return new entities_1.User({
                        ...data,
                        id: doc.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastLogin,
                    });
                }
                return new entities_1.User({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                    lastLogin,
                });
            });
        }
        catch (error) {
            console.error("Erro ao buscar todos os usuários:", error);
            throw new Error("Error fetching users");
        }
    }
    async findByRole(role) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("role", "==", role));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
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
                    return new entities_1.User({
                        ...data,
                        id: doc.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        lastLogin,
                    });
                }
                return new entities_1.User({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                    lastLogin,
                });
            });
        }
        catch (error) {
            console.error(`Erro ao buscar usuários por role ${role}:`, error);
            throw new Error("Error fetching users by role");
        }
    }
}
exports.FirebaseUserRepository = FirebaseUserRepository;
//# sourceMappingURL=FirebaseUserRepository.js.map