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
import { Checkout, CheckoutProps, CheckoutStatus } from "../../domain/entities";
import { CheckoutRepository } from "../../domain/interfaces/repositories";

function removeUndefinedFields(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedFields);
  }
  if (typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, removeUndefinedFields(value)])
    );
  }
  return obj;
}

// Implementação do repositório com Firestore
class FirebaseCheckoutRepository implements CheckoutRepository {
  private readonly collectionName = "checkouts";

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

  async save(checkout: Checkout): Promise<string> {
    const checkoutDTO = checkout.toDTO();

    // Remover campos undefined recursivamente, incluindo id
    const cleanedDTO = removeUndefinedFields({
      ...checkoutDTO,
      id: undefined,
    });

    const docRef = checkout.id
      ? doc(db, this.collectionName, checkout.id)
      : doc(collection(db, this.collectionName));

    await setDoc(docRef, {
      ...cleanedDTO,
      // createdAt: checkoutDTO.createdAt.toISOString(),
      // updatedAt: checkoutDTO.updatedAt.toISOString(),
    });

    return docRef.id;
  }

  async findById(id: string): Promise<Checkout | null> {
    const docRef = doc(db, this.collectionName, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return new Checkout({
      ...data,
      id: docSnap.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as CheckoutProps);
  }

  async findByOrderId(orderId: string): Promise<Checkout | null> {
    const q = query(
      collection(db, this.collectionName),
      where("orderId", "==", orderId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return new Checkout({
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as CheckoutProps);
  }

  async findByMercadoPagoId(mercadoPagoId: string): Promise<Checkout | null> {
    const q = query(
      collection(db, this.collectionName),
      where("mercadoPagoId", "==", mercadoPagoId)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    return new Checkout({
      ...data,
      id: doc.id,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as CheckoutProps);
  }

  async findByEventId(eventId: string): Promise<Checkout[]> {
    const q = query(
      collection(db, this.collectionName),
      where("metadata.eventId", "==", eventId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return new Checkout({
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as CheckoutProps);
    });
  }

  async findByStatus(status: CheckoutProps["status"]): Promise<Checkout[]> {
    const q = query(
      collection(db, this.collectionName),
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      return new Checkout({
        ...data,
        id: doc.id,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as CheckoutProps);
    });
  }

  async update(checkout: Checkout): Promise<void> {
    if (!checkout.id) throw new Error("Checkout ID is required for update");
    const checkoutDTO = checkout.toDTO();
    const docRef = doc(db, this.collectionName, checkout.id);
    // await updateDoc(docRef, {
    //   ...checkoutDTO,
    //   createdAt: checkoutDTO.createdAt.toISOString(),
    //   updatedAt: checkoutDTO.updatedAt.toISOString(),
    // });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  async updateStatusByMercadoPagoId(
    mercadoPagoId: string,
    status: CheckoutStatus
  ): Promise<void> {
    console.log(
      `Atualizando status para mercadoPagoId: ${mercadoPagoId}, status: ${status}`
    );
    const checkout = await this.findByMercadoPagoId(mercadoPagoId);
    if (!checkout) {
      console.error(
        `Checkout não encontrado para mercadoPagoId: ${mercadoPagoId}`
      );
      throw new Error(
        `Checkout não encontrado para mercadoPagoId: ${mercadoPagoId}`
      );
    }
    checkout.updateStatus(status);
    await this.update(checkout);
    console.log(
      `Checkout atualizado com ID: ${checkout.id}, status: ${status}`
    );
  }
}

export { CheckoutRepository, FirebaseCheckoutRepository };
