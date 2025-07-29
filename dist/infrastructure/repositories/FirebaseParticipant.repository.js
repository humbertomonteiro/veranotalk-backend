"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseParticipantRepository = void 0;
const firestore_1 = require("firebase/firestore");
const firebaseConfig_1 = require("../config/firebaseConfig");
const entities_1 = require("../../domain/entities");
class FirebaseParticipantRepository {
    constructor() {
        this.collectionName = "participants";
    }
    async save(participant) {
        const participantDTO = participant.toDTO();
        // Remover campos undefined e o campo id explicitamente
        const cleanedDTO = Object.fromEntries(Object.entries(participantDTO).filter(([key, value]) => key !== "id" && value !== undefined));
        const docRef = participant.id
            ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, participant.id)
            : (0, firestore_1.doc)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
        await (0, firestore_1.setDoc)(docRef, {
            ...cleanedDTO,
            createdAt: participant.createdAt.toISOString(),
            updatedAt: participant.updatedAt.toISOString(),
        });
        return docRef.id;
    }
    async findById(id) {
        const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
        const docSnap = await (0, firestore_1.getDoc)(docRef);
        if (!docSnap.exists())
            return null;
        const data = docSnap.data();
        return new entities_1.Participant({
            ...data,
            id: docSnap.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        });
    }
    async findByDocument(document) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("document", "==", document));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        if (querySnapshot.empty)
            return null;
        const doc = querySnapshot.docs[0];
        const data = doc.data();
        return new entities_1.Participant({
            ...data,
            id: doc.id,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
        });
    }
    async findByCheckoutId(checkoutId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("checkoutId", "==", checkoutId));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return new entities_1.Participant({
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            });
        });
    }
    async findByEventId(eventId) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("eventId", "==", eventId));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return new entities_1.Participant({
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            });
        });
    }
    async findByTicketType(eventId, ticketType) {
        const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("eventId", "==", eventId), (0, firestore_1.where)("ticketType", "==", ticketType));
        const querySnapshot = await (0, firestore_1.getDocs)(q);
        return querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return new entities_1.Participant({
                ...data,
                id: doc.id,
                createdAt: new Date(data.createdAt),
                updatedAt: new Date(data.updatedAt),
            });
        });
    }
    async update(participant) {
        if (!participant.id)
            throw new Error("Participant ID is required for update");
        const participantDTO = participant.toDTO();
        const cleanedDTO = Object.fromEntries(Object.entries(participantDTO).filter(([key, value]) => key !== "id" && value !== undefined));
        const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, participant.id);
        await (0, firestore_1.updateDoc)(docRef, {
            ...cleanedDTO,
            createdAt: participant.createdAt.toISOString(),
            updatedAt: participant.updatedAt.toISOString(),
        });
    }
    async delete(id) {
        const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
        await (0, firestore_1.deleteDoc)(docRef);
    }
}
exports.FirebaseParticipantRepository = FirebaseParticipantRepository;
//# sourceMappingURL=FirebaseParticipant.repository.js.map