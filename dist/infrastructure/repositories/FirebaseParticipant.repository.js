"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseParticipantRepository = void 0;
const firestore_1 = require("firebase/firestore");
const firebaseConfig_1 = require("../config/firebaseConfig");
const entities_1 = require("../../domain/entities");
const errors_1 = require("../../utils/errors");
class FirebaseParticipantRepository {
    constructor() {
        this.collectionName = "participants";
    }
    async save(participant) {
        try {
            const participantData = {
                checkoutId: participant.checkoutId,
                eventId: participant.eventId,
                name: participant.name,
                email: participant.email,
                phone: participant.phone,
                document: participant.document,
                ticketType: participant.ticketType,
                checkedIn: participant.checkedIn,
                qrCode: participant.qrCode, // Usa qrCode real, não mascarado
                createdAt: participant.createdAt.toISOString(),
                updatedAt: participant.updatedAt.toISOString(),
            };
            const cleanedData = Object.fromEntries(Object.entries(participantData).filter(([_, value]) => value !== undefined));
            const docRef = participant.id
                ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, participant.id)
                : (0, firestore_1.doc)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName));
            await (0, firestore_1.setDoc)(docRef, cleanedData);
            return docRef.id;
        }
        catch (error) {
            console.error("Erro ao salvar participante:", error);
            throw new errors_1.InternalServerError("Erro ao salvar participante");
        }
    }
    async update(participant) {
        if (!participant.id) {
            throw new errors_1.NotFoundError("ID do participante é necessário para atualização");
        }
        try {
            const participantData = {
                checkoutId: participant.checkoutId,
                eventId: participant.eventId,
                name: participant.name,
                email: participant.email,
                phone: participant.phone,
                document: participant.document,
                ticketType: participant.ticketType,
                checkedIn: participant.checkedIn,
                qrCode: participant.qrCode, // Usa qrCode real
                createdAt: participant.createdAt.toISOString(),
                updatedAt: participant.updatedAt.toISOString(),
            };
            const cleanedData = Object.fromEntries(Object.entries(participantData).filter(([_, value]) => value !== undefined));
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, participant.id);
            console.log(`Atualizando participante com ID: ${participant.id}, Dados: ${JSON.stringify(cleanedData)}`);
            await (0, firestore_1.updateDoc)(docRef, cleanedData);
        }
        catch (error) {
            console.error("Erro ao atualizar participante:", error);
            throw new errors_1.InternalServerError(`Erro ao atualizar participante: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        }
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
                console.error(`Valores de data inválidos no documento ${id}:`, {
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                });
                throw new errors_1.InternalServerError("Valores de data inválidos no documento do participante");
            }
            return new entities_1.Participant({
                ...data,
                id: docSnap.id,
                createdAt,
                updatedAt,
            });
        }
        catch (error) {
            console.error("Erro ao buscar participante:", error);
            throw new errors_1.InternalServerError("Erro ao buscar participante");
        }
    }
    async findByDocument(document) {
        try {
            console.log(`Buscando participante com documento: ${document}`);
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("document", "==", document));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            if (querySnapshot.empty) {
                console.log(`Nenhum participante encontrado para o documento: ${document}`);
                return null;
            }
            const doc = querySnapshot.docs[0];
            const data = doc.data();
            const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
            return new entities_1.Participant({
                ...data,
                id: doc.id,
                createdAt,
                updatedAt,
            });
            // return data;
        }
        catch (error) {
            console.error("Erro ao buscar participante por documento:", error);
            throw new errors_1.InternalServerError("Erro ao buscar participante por documento");
        }
    }
    async findByCheckoutId(checkoutId) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("checkoutId", "==", checkoutId));
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
                    console.error(`Valores de data inválidos no documento ${doc.id}:`, {
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    throw new errors_1.InternalServerError("Valores de data inválidos no documento do participante");
                }
                return new entities_1.Participant({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error("Erro ao buscar participantes por checkoutId:", error);
            throw new errors_1.InternalServerError("Erro ao buscar participantes por checkoutId");
        }
    }
    async findByEventId(eventId) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("eventId", "==", eventId));
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
                    console.error(`Valores de data inválidos no documento ${doc.id}:`, {
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    throw new errors_1.InternalServerError("Valores de data inválidos no documento do participante");
                }
                return new entities_1.Participant({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error("Erro ao buscar participantes por eventId:", error);
            throw new errors_1.InternalServerError("Erro ao buscar participantes por eventId");
        }
    }
    async findByTicketType(eventId, ticketType) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("eventId", "==", eventId), (0, firestore_1.where)("ticketType", "==", ticketType));
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
                    console.error(`Valores de data inválidos no documento ${doc.id}:`, {
                        createdAt: data.createdAt,
                        updatedAt: data.updatedAt,
                    });
                    throw new errors_1.InternalServerError("Valores de data inválidos no documento do participante");
                }
                return new entities_1.Participant({
                    ...data,
                    id: doc.id,
                    createdAt,
                    updatedAt,
                });
            });
        }
        catch (error) {
            console.error("Erro ao buscar participantes por ticketType:", error);
            throw new errors_1.InternalServerError("Erro ao buscar participantes por ticketType");
        }
    }
    async delete(id) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
            await (0, firestore_1.deleteDoc)(docRef);
        }
        catch (error) {
            console.error("Erro ao deletar participante:", error);
            throw new errors_1.InternalServerError("Erro ao deletar participante");
        }
    }
}
exports.FirebaseParticipantRepository = FirebaseParticipantRepository;
//# sourceMappingURL=FirebaseParticipant.repository.js.map