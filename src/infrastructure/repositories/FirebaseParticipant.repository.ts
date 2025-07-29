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

class FirebaseParticipantRepository implements ParticipantRepository {
  private readonly collectionName = "participants";

  async save(participant: Participant): Promise<string> {
    const participantDTO = participant.toDTO();

    // Remover campos undefined e o campo id explicitamente
    const cleanedDTO = Object.fromEntries(
      Object.entries(participantDTO).filter(
        ([key, value]) => key !== "id" && value !== undefined
      )
    );

    const docRef = participant.id
      ? doc(db, this.collectionName, participant.id)
      : doc(collection(db, this.collectionName));

    await setDoc(docRef, {
      ...cleanedDTO,
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
    });

    return docRef.id;
  }

  async findById(id: string): Promise<Participant | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return new Participant({
      ...data,
      id: docSnap.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as ParticipantProps);
  }

  async findByDocument(document: string): Promise<Participant | null> {
    const q = query(
      collection(db, this.collectionName),
      where("document", "==", document)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return new Participant({
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as ParticipantProps);
  }

  async findByCheckoutId(checkoutId: string): Promise<Participant[]> {
    const q = query(
      collection(db, this.collectionName),
      where("checkoutId", "==", checkoutId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return new Participant({
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as ParticipantProps);
    });
  }

  async findByEventId(eventId: string): Promise<Participant[]> {
    const q = query(
      collection(db, this.collectionName),
      where("eventId", "==", eventId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return new Participant({
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as ParticipantProps);
    });
  }

  async findByTicketType(
    eventId: string,
    ticketType: ParticipantProps["ticketType"]
  ): Promise<Participant[]> {
    const q = query(
      collection(db, this.collectionName),
      where("eventId", "==", eventId),
      where("ticketType", "==", ticketType)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return new Participant({
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as ParticipantProps);
    });
  }

  async update(participant: Participant): Promise<void> {
    if (!participant.id)
      throw new Error("Participant ID is required for update");
    const participantDTO = participant.toDTO();
    const cleanedDTO = Object.fromEntries(
      Object.entries(participantDTO).filter(
        ([key, value]) => key !== "id" && value !== undefined
      )
    );
    const docRef = doc(db, this.collectionName, participant.id);
    await updateDoc(docRef, {
      ...cleanedDTO,
      createdAt: participant.createdAt.toISOString(),
      updatedAt: participant.updatedAt.toISOString(),
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }
}

export { ParticipantRepository, FirebaseParticipantRepository };
