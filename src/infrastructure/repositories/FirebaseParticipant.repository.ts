import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import { Participant, ParticipantProps } from "../../domain/entities";
import { ParticipantRepository } from "../../domain/interfaces/repositories";
import { NotFoundError, InternalServerError } from "../../utils/errors";

class FirebaseParticipantRepository implements ParticipantRepository {
  private readonly collectionName = "participants";

  async save(participant: Participant): Promise<string> {
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
      const cleanedData = Object.fromEntries(
        Object.entries(participantData).filter(
          ([_, value]) => value !== undefined
        )
      );
      const docRef = participant.id
        ? doc(db, this.collectionName, participant.id)
        : doc(collection(db, this.collectionName));
      await setDoc(docRef, cleanedData);
      return docRef.id;
    } catch (error) {
      console.error("Erro ao salvar participante:", error);
      throw new InternalServerError("Erro ao salvar participante");
    }
  }

  async update(participant: Participant): Promise<void> {
    if (!participant.id) {
      throw new NotFoundError(
        "ID do participante é necessário para atualização"
      );
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
      const cleanedData = Object.fromEntries(
        Object.entries(participantData).filter(
          ([_, value]) => value !== undefined
        )
      );
      const docRef = doc(db, this.collectionName, participant.id);
      console.log(
        `Atualizando participante com ID: ${
          participant.id
        }, Dados: ${JSON.stringify(cleanedData)}`
      );
      await updateDoc(docRef, cleanedData);
    } catch (error) {
      console.error("Erro ao atualizar participante:", error);
      throw new InternalServerError(
        `Erro ao atualizar participante: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`
      );
    }
  }

  async findById(id: string): Promise<Participant | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Valores de data inválidos no documento ${id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        throw new InternalServerError(
          "Valores de data inválidos no documento do participante"
        );
      }
      return new Participant({
        ...data,
        id: docSnap.id,
        createdAt,
        updatedAt,
      } as ParticipantProps);
    } catch (error) {
      console.error("Erro ao buscar participante:", error);
      throw new InternalServerError("Erro ao buscar participante");
    }
  }

  async findByDocument(document: string): Promise<Participant | null> {
    try {
      console.log(`Buscando participante com documento: ${document}`);
      const q = query(
        collection(db, this.collectionName),
        where("document", "==", document)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        console.log(
          `Nenhum participante encontrado para o documento: ${document}`
        );
        return null;
      }
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      return new Participant({
        ...data,
        id: doc.id,
        createdAt,
        updatedAt,
      } as ParticipantProps);
      // return data;
    } catch (error) {
      console.error("Erro ao buscar participante por documento:", error);
      throw new InternalServerError(
        "Erro ao buscar participante por documento"
      );
    }
  }

  async findByCheckoutId(checkoutId: string): Promise<Participant[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("checkoutId", "==", checkoutId)
      );
      const querySnapshot = await getDocs(q);
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
          throw new InternalServerError(
            "Valores de data inválidos no documento do participante"
          );
        }
        return new Participant({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
        } as ParticipantProps);
      });
    } catch (error) {
      console.error("Erro ao buscar participantes por checkoutId:", error);
      throw new InternalServerError(
        "Erro ao buscar participantes por checkoutId"
      );
    }
  }

  async findByEventId(eventId: string): Promise<Participant[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("eventId", "==", eventId)
      );
      const querySnapshot = await getDocs(q);
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
          throw new InternalServerError(
            "Valores de data inválidos no documento do participante"
          );
        }
        return new Participant({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
        } as ParticipantProps);
      });
    } catch (error) {
      console.error("Erro ao buscar participantes por eventId:", error);
      throw new InternalServerError("Erro ao buscar participantes por eventId");
    }
  }

  async findByTicketType(
    eventId: string,
    ticketType: ParticipantProps["ticketType"]
  ): Promise<Participant[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("eventId", "==", eventId),
        where("ticketType", "==", ticketType)
      );
      const querySnapshot = await getDocs(q);
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
          throw new InternalServerError(
            "Valores de data inválidos no documento do participante"
          );
        }
        return new Participant({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
        } as ParticipantProps);
      });
    } catch (error) {
      console.error("Erro ao buscar participantes por ticketType:", error);
      throw new InternalServerError(
        "Erro ao buscar participantes por ticketType"
      );
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Erro ao deletar participante:", error);
      throw new InternalServerError("Erro ao deletar participante");
    }
  }
}

export { ParticipantRepository, FirebaseParticipantRepository };
