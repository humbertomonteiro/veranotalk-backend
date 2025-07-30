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

class FirebaseCheckoutRepository implements CheckoutRepository {
  private readonly collectionName = "checkouts";

  async save(checkout: Checkout): Promise<string> {
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
      ? doc(db, this.collectionName, checkout.id)
      : doc(collection(db, this.collectionName));

    await setDoc(docRef, cleanedDTO);
    return docRef.id;
  }

  async findById(id: string): Promise<Checkout | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Invalid date values in document ${id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new Checkout({
          ...data,
          id: docSnap.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CheckoutProps);
      }
      return new Checkout({
        ...data,
        id: docSnap.id,
        createdAt,
        updatedAt,
      } as CheckoutProps);
    } catch (error) {
      console.error(`Error fetching checkout by ID ${id}:`, error);
      throw new Error("Error fetching checkout");
    }
  }

  async findByOrderId(orderId: string): Promise<Checkout | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("orderId", "==", orderId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Invalid date values in document ${doc.id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new Checkout({
          ...data,
          id: doc.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CheckoutProps);
      }
      return new Checkout({
        ...data,
        id: doc.id,
        createdAt,
        updatedAt,
      } as CheckoutProps);
    } catch (error) {
      console.error(`Error fetching checkout by orderId ${orderId}:`, error);
      throw new Error("Error fetching checkout");
    }
  }

  async findByMercadoPagoId(mercadoPagoId: string): Promise<Checkout | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("mercadoPagoId", "==", mercadoPagoId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Invalid date values in document ${doc.id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        });
        return new Checkout({
          ...data,
          id: doc.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as CheckoutProps);
      }
      return new Checkout({
        ...data,
        id: doc.id,
        createdAt,
        updatedAt,
      } as CheckoutProps);
    } catch (error) {
      console.error(
        `Error fetching checkout by mercadoPagoId ${mercadoPagoId}:`,
        error
      );
      throw new Error("Error fetching checkout");
    }
  }

  async findByEventId(eventId: string): Promise<Checkout[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("metadata.eventId", "==", eventId)
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
          console.error(`Invalid date values in document ${doc.id}:`, {
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new Checkout({
            ...data,
            id: doc.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as CheckoutProps);
        }
        return new Checkout({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
        } as CheckoutProps);
      });
    } catch (error) {
      console.error(`Error fetching checkouts by eventId ${eventId}:`, error);
      throw new Error("Error fetching checkouts");
    }
  }

  async findByStatus(status: CheckoutProps["status"]): Promise<Checkout[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("status", "==", status)
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
          console.error(`Invalid date values in document ${doc.id}:`, {
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
          return new Checkout({
            ...data,
            id: doc.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as CheckoutProps);
        }
        return new Checkout({
          ...data,
          id: doc.id,
          createdAt,
          updatedAt,
        } as CheckoutProps);
      });
    } catch (error) {
      console.error(`Error fetching checkouts by status ${status}:`, error);
      throw new Error("Error fetching checkouts");
    }
  }

  async update(checkout: Checkout): Promise<void> {
    try {
      if (!checkout.id) throw new Error("Checkout ID is required for update");
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
      const docRef = doc(db, this.collectionName, checkout.id);
      await updateDoc(docRef, cleanedDTO);
    } catch (error) {
      console.error(`Error updating checkout ${checkout.id}:`, error);
      throw new Error("Error updating checkout");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting checkout ${id}:`, error);
      throw new Error("Error deleting checkout");
    }
  }

  async updateStatusByMercadoPagoId(
    mercadoPagoId: string,
    status: CheckoutStatus
  ): Promise<void> {
    try {
      console.log(
        `Updating status for mercadoPagoId: ${mercadoPagoId}, status: ${status}`
      );
      const checkout = await this.findByMercadoPagoId(mercadoPagoId);
      if (!checkout) {
        console.error(`Checkout not found for mercadoPagoId: ${mercadoPagoId}`);
        throw new Error(
          `Checkout not found for mercadoPagoId: ${mercadoPagoId}`
        );
      }
      checkout.updateStatus(status);
      await this.update(checkout);
      console.log(
        `Checkout updated with ID: ${checkout.id}, status: ${status}`
      );
    } catch (error) {
      console.error(
        `Error updating status for mercadoPagoId ${mercadoPagoId}:`,
        error
      );
      throw new Error("Error updating checkout status");
    }
  }
}

export { CheckoutRepository, FirebaseCheckoutRepository };
