"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseCouponRepository = void 0;
const firestore_1 = require("firebase/firestore");
const firebaseConfig_1 = require("../config/firebaseConfig");
const Coupon_1 = require("../../domain/entities/Coupon");
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
class FirebaseCouponRepository {
    constructor() {
        this.collectionName = "coupons";
    }
    async save(coupon) {
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
            ? (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, coupon.id)
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
            const expiresAt = data.expiresAt ? new Date(data.expiresAt) : undefined;
            if (isNaN(createdAt.getTime()) || isNaN(updatedAt.getTime())) {
                console.error(`Invalid date values in document ${id}:`, {
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt,
                    expiresAt: data.expiresAt,
                });
                return new Coupon_1.Coupon({
                    ...data,
                    id: docSnap.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    expiresAt,
                });
            }
            return new Coupon_1.Coupon({
                ...data,
                id: docSnap.id,
                createdAt,
                updatedAt,
                expiresAt,
            });
        }
        catch (error) {
            console.error(`Error fetching coupon by ID ${id}:`, error);
            throw new Error("Error fetching coupon");
        }
    }
    async findByCode(code) {
        try {
            const q = (0, firestore_1.query)((0, firestore_1.collection)(firebaseConfig_1.db, this.collectionName), (0, firestore_1.where)("code", "==", code));
            const querySnapshot = await (0, firestore_1.getDocs)(q);
            if (querySnapshot.empty)
                return null;
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
                return new Coupon_1.Coupon({
                    ...data,
                    id: doc.id,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    expiresAt,
                });
            }
            return new Coupon_1.Coupon({
                ...data,
                id: doc.id,
                createdAt,
                updatedAt,
                expiresAt,
            });
        }
        catch (error) {
            console.error(`Error fetching coupon by code ${code}:`, error);
            throw new Error("Error fetching coupon");
        }
    }
    async update(coupon) {
        try {
            if (!coupon.id)
                throw new Error("Coupon ID is required for update");
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
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, coupon.id);
            await (0, firestore_1.updateDoc)(docRef, cleanedDTO);
        }
        catch (error) {
            console.error(`Error updating coupon ${coupon.id}:`, error);
            throw new Error("Error updating coupon");
        }
    }
    async delete(id) {
        try {
            const docRef = (0, firestore_1.doc)(firebaseConfig_1.db, this.collectionName, id);
            await (0, firestore_1.deleteDoc)(docRef);
        }
        catch (error) {
            console.error(`Error deleting coupon ${id}:`, error);
            throw new Error("Error deleting coupon");
        }
    }
}
exports.FirebaseCouponRepository = FirebaseCouponRepository;
//# sourceMappingURL=FirebaseCupon.repository.js.map