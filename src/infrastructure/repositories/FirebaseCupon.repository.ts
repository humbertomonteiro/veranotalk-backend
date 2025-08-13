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
import { Coupon, CouponProps } from "../../domain/entities/Coupon";
import { CouponRepository } from "../../domain/interfaces/repositories";

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

class FirebaseCouponRepository implements CouponRepository {
  private readonly collectionName = "coupons";

  async save(coupon: Coupon): Promise<string> {
    const couponDTO = coupon.toDTO();
    const cleanedDTO = removeUndefinedFields({
      ...couponDTO,
      id: undefined,
      createdAt: couponDTO.createdAt
        ? couponDTO.createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: couponDTO.updatedAt
        ? couponDTO.updatedAt.toISOString()
        : new Date().toISOString(),
      expiresAt: couponDTO.expiresAt
        ? couponDTO.expiresAt.toISOString()
        : undefined,
    });

    const docRef = coupon.id
      ? doc(db, this.collectionName, coupon.id)
      : doc(collection(db, this.collectionName));

    await setDoc(docRef, cleanedDTO);
    return docRef.id;
  }

  async findById(id: string): Promise<Coupon | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Invalid date values in document ${id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          expiresAt: data.expiresAt,
        });
        return new Coupon({
          ...data,
          id: docSnap.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt,
        } as CouponProps);
      }
      return new Coupon({
        ...data,
        id: docSnap.id,
        createdAt,
        updatedAt,
        expiresAt,
      } as CouponProps);
    } catch (error) {
      console.error(`Error fetching coupon by ID ${id}:`, error);
      throw new Error("Error fetching coupon");
    }
  }

  async findByCode(code: string): Promise<Coupon | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where("code", "==", code)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const doc = querySnapshot.docs[0];
      const data = doc.data();
      const createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
      const updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
      const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
      if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
        console.error(`Invalid date values in document ${doc.id}:`, {
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          expiresAt: data.expiresAt,
        });
        return new Coupon({
          ...data,
          id: doc.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          expiresAt,
        } as CouponProps);
      }
      return new Coupon({
        ...data,
        id: doc.id,
        createdAt,
        updatedAt,
        expiresAt,
      } as CouponProps);
    } catch (error) {
      console.error(`Error fetching coupon by code ${code}:`, error);
      throw new Error("Error fetching coupon");
    }
  }

  async update(coupon: Coupon): Promise<void> {
    try {
      if (!coupon.id) throw new Error("Coupon ID is required for update");
      const couponDTO = coupon.toDTO();
      const cleanedDTO = removeUndefinedFields({
        ...couponDTO,
        id: undefined,
        createdAt: couponDTO.createdAt
          ? couponDTO.createdAt.toISOString()
          : new Date().toISOString(),
        updatedAt: couponDTO.updatedAt
          ? couponDTO.updatedAt.toISOString()
          : new Date().toISOString(),
        expiresAt: couponDTO.expiresAt
          ? couponDTO.expiresAt.toISOString()
          : undefined,
      });
      const docRef = doc(db, this.collectionName, coupon.id);
      await updateDoc(docRef, cleanedDTO);
    } catch (error) {
      console.error(`Error updating coupon ${coupon.id}:`, error);
      throw new Error("Error updating coupon");
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`Error deleting coupon ${id}:`, error);
      throw new Error("Error deleting coupon");
    }
  }
}

export { CouponRepository, FirebaseCouponRepository };
