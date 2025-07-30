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
// Implementação do repositório com Firestore
class FirebaseCheckoutRepository {
    constructor() {
        this.collectionName = "checkouts";
    }
    //   async save(checkout: Checkout): Promise<string> {
    //     const checkoutDTO = checkout.toDTO();
    //     const docRef = checkout.id
    //       ? doc(db, this.collectionName, checkout.id)
    //       : doc(collection(db, this.collectionName));
    //     await setDoc(docRef, {
    //       ...checkoutDTO,
    //       createdAt: checkoutDTO.createdAt.toISOString(),
    //       updatedAt: checkoutDTO.updatedAt.toISOString(),
    //     });
    //     return docRef.id;
    //   }
    async save(checkout) {
        const checkoutDTO = checkout.toDTO();
        // Remover campos undefined recursivamente, incluindo id
        const cleanedDTO = removeUndefinedFields({
            ...checkoutDTO,
            id: undefined,
        });
        const docRef = checkout.id
            ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, checkout.id)
            : (0, firestore_1.doc)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
        await (0, firestore_1.setDoc)(docRef, {
            ...cleanedDTO,
            // createdAt: checkoutDTO.createdAt.toISOString(),
            // updatedAt: checkoutDTO.updatedAt.toISOString(),
        });
        return docRef.id;
    }
    async findById(id) {
        const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        if (!docSnap.exists())
            return null;
        const data = docSnap.data();
        return new entities_1.Checkout({
            ...data,
            id: docSnap.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        });
    }
    async findByOrderId(orderId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("orderId", "==", orderId));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty)
            return null;
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return new entities_1.Checkout({
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        });
    }
    async findByMercadoPagoId(mercadoPagoId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("mercadoPagoId", "==", mercadoPagoId));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty)
            return null;
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return new entities_1.Checkout({
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        });
    }
    async findByEventId(eventId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("metadata.eventId", "==", eventId));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return new entities_1.Checkout({
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            });
        });
    }
    async findByStatus(status) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("status", "==", status));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return new entities_1.Checkout({
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            });
        });
    }
    async update(checkout) {
        if (!checkout.id)
            throw new Error("Checkout ID is required for update");
        const checkoutDTO = checkout.toDTO();
        const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, checkout.id);
        // await updateDoc(docRef, {
        //   ...checkoutDTO,
        //   createdAt: checkoutDTO.createdAt.toISOString(),
        //   updatedAt: checkoutDTO.updatedAt.toISOString(),
        // });
    }
    async delete(id) {
        const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
        await (0, firestore_1.deleteDoc)(docRef);
    }
    async updateStatusByMercadoPagoId(mercadoPagoId, status) {
        console.log(`Atualizando status para mercadoPagoId: ${mercadoPagoId}, status: ${status}`);
        const checkout = await this.findByMercadoPagoId(mercadoPagoId);
        if (!checkout) {
            console.error(`Checkout não encontrado para mercadoPagoId: ${mercadoPagoId}`);
            throw new Error(`Checkout não encontrado para mercadoPagoId: ${mercadoPagoId}`);
        }
        checkout.updateStatus(status);
        await this.update(checkout);
        console.log(`Checkout atualizado com ID: ${checkout.id}, status: ${status}`);
    }
}
exports.FirebaseCheckoutRepository = FirebaseCheckoutRepository;
//# sourceMappingURL=FirebaseCheckout.repository.js.map