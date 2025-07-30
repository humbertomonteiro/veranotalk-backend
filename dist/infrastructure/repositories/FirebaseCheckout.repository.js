"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseCheckoutRepository = void 0;
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
class FirebaseCheckoutRepository {
    constructor() {
        this.collectionName = "checkouts";
    }
    async save(checkout) {
        const checkoutDTO = checkout.toDTO();
        const cleanedDTO = removeUndefinedFields({
            ...checkoutDTO,
            id: undefined,
            createdAt: checkoutDTO.createdAt
                ? checkoutDTO.createdAt.toISOString()
                : new Date().toISOString(),
            updatedAt: checkoutDTO.updatedAt
                ? checkoutDTO.updatedAt.toISOString()
                : new Date().toISOString(),
        });
        const docRef = checkout.id
            ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, checkout.id)
            : (0, firestore_1.doc)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
        await (0, firestore_1.setDoc)(docRef, cleanedDTO);
        return docRef.id;
    }
    async findById(id) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
            const docSnap = await (0, firestore_1.getDoc)(docRef);
            if (!docSnap.exists())
                return null;
            const data = docSnap.data();
            const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.error(`Invalid date values in document ${id}:`, {
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                });
                return new entities_1.Checkout({
                    ...data,
                    id: docSnap.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            return new entities_1.Checkout({
                ...data,
                id: docSnap.id,
                createdAt,
                updatedAt,
            });
        }
        catch (error) {
            console.error(`Error fetching checkout by ID ${id}:`, error);
            throw new Error("Error fetching checkout");
        }
    }
    async findByOrderId(orderId) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("orderId", "==", orderId));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            if (querySnapshot.empty)
                return null;
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.error(`Invalid date values in document ${doc.id}:`, {
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                });
                return new entities_1.Checkout({
                    ...data,
                    id: doc.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            return new entities_1.Checkout({
                ...data,
                id: doc.id,
                createdAt,
                updatedAt,
            });
        }
        catch (error) {
            console.error(`Error fetching checkout by orderId ${orderId}:`, error);
            throw new Error("Error fetching checkout");
        }
    }
    async findByMercadoPagoId(mercadoPagoId) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("mercadoPagoId", "==", mercadoPagoId));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            if (querySnapshot.empty)
                return null;
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.error(`Invalid date values in document ${doc.id}:`, {
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                });
                return new entities_1.Checkout({
                    ...data,
                    id: doc.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            }
            return new entities_1.Checkout({
                ...data,
                id: doc.id,
                createdAt,
                updatedAt,
            });
        }
        catch (error) {
            console.error(`Error fetching checkout by mercadoPagoId ${mercadoPagoId}:`, error);
            throw new Error("Error fetching checkout");
        }
    }
    async findByEventId(eventId) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("metadata.eventId", "==", eventId));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt
                    ? new Date(data.createdAt)
                    : new Date();
                const updatedAt = data.updatedAt
                    ? new Date(data.updatedAt)
                    : new Date();
                if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                    console.error(`Invalid date values in document ${doc.id}:`, {
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    return new entities_1.Checkout({
                        ...data,
                        id: doc.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                return new entities_1.Checkout({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error(`Error fetching checkouts by eventId ${eventId}:`, error);
            throw new Error("Error fetching checkouts");
        }
    }
    async findByStatus(status) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("status", "==", status));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                const createdAt = data.createdAt
                    ? new Date(data.createdAt)
                    : new Date();
                const updatedAt = data.updatedAt
                    ? new Date(data.updatedAt)
                    : new Date();
                if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                    console.error(`Invalid date values in document ${doc.id}:`, {
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    return new entities_1.Checkout({
                        ...data,
                        id: doc.id,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                }
                return new entities_1.Checkout({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error(`Error fetching checkouts by status ${status}:`, error);
            throw new Error("Error fetching checkouts");
        }
    }
    async update(checkout) {
        try {
            if (!checkout.id)
                throw new Error("Checkout ID is required for update");
            const checkoutDTO = checkout.toDTO();
            const cleanedDTO = removeUndefinedFields({
                ...checkoutDTO,
                id: undefined,
                createdAt: checkoutDTO.createdAt
                    ? checkoutDTO.createdAt.toISOString()
                    : new Date().toISOString(),
                updatedAt: checkoutDTO.updatedAt
                    ? checkoutDTO.updatedAt.toISOString()
                    : new Date().toISOString(),
            });
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, checkout.id);
            await (0, firestore_1.updateDoc)(docRef, cleanedDTO);
        }
        catch (error) {
            console.error(`Error updating checkout ${checkout.id}:`, error);
            throw new Error("Error updating checkout");
        }
    }
    async delete(id) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
            await (0, firestore_1.deleteDoc)(docRef);
        }
        catch (error) {
            console.error(`Error deleting checkout ${id}:`, error);
            throw new Error("Error deleting checkout");
        }
    }
    async updateStatusByMercadoPagoId(mercadoPagoId, status) {
        try {
            console.log(`Updating status for mercadoPagoId: ${mercadoPagoId}, status: ${status}`);
            const checkout = await this.findByMercadoPagoId(mercadoPagoId);
            if (!checkout) {
                console.error(`Checkout not found for mercadoPagoId: ${mercadoPagoId}`);
                throw new Error(`Checkout not found for mercadoPagoId: ${mercadoPagoId}`);
            }
            checkout.updateStatus(status);
            await this.update(checkout);
            console.log(`Checkout updated with ID: ${checkout.id}, status: ${status}`);
        }
        catch (error) {
            console.error(`Error updating status for mercadoPagoId ${mercadoPagoId}:`, error);
            throw new Error("Error updating checkout status");
        }
    }
}
exports.FirebaseCheckoutRepository = FirebaseCheckoutRepository;
//# sourceMappingURL=FirebaseCheckout.repository.js.map