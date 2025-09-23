"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
const Coupon_1 = require("../../../domain/entities/Coupon");
class CouponService {
    constructor(couponRepository) {
        this.couponRepository = couponRepository;
    }
    async createCoupon(couponData) {
        try {
            const processedData = {
                ...couponData,
                code: couponData.code.toLowerCase(),
                expiresAt: couponData.expiresAt
                    ? new Date(couponData.expiresAt)
                    : undefined,
            };
            const coupon = new Coupon_1.Coupon(processedData);
            const couponId = await this.couponRepository.save(coupon);
            if (!couponId) {
                return null;
            }
            return coupon;
        }
        catch (error) {
            throw new Error(`Erro ao criar cupom, error: ${error}`);
        }
    }
    async validateCoupon(code) {
        const codeLowerCasw = code.toLowerCase();
        const coupon = await this.couponRepository.findByCode(codeLowerCasw);
        if (!coupon) {
            throw new Error("Cupom não existe");
        }
        try {
            coupon.isValid();
            return coupon;
        }
        catch (error) {
            throw new Error(`${error}`);
        }
    }
    async getAllCoupons() {
        try {
            return await this.couponRepository.findAll();
        }
        catch (err) {
            console.error("Erro ao buscar todos os cupons:", err);
            throw new Error("Failed to fetch coupons");
        }
    }
    async updateCoupon(id, couponData) {
        try {
            const existingCoupon = await this.couponRepository.findById(id);
            if (!existingCoupon) {
                return null;
            }
            const updatedData = {
                ...existingCoupon.toDTO(),
                ...couponData,
                id,
                updatedAt: new Date(),
            };
            const coupon = new Coupon_1.Coupon(updatedData);
            await this.couponRepository.update(coupon);
            return coupon;
        }
        catch (error) {
            console.error(`Erro ao atualizar cupom ${id}:`, error);
            throw new Error(`Erro ao atualizar cupom: ${error}`);
        }
    }
    async deleteCoupon(id) {
        try {
            const coupon = await this.couponRepository.findById(id);
            if (!coupon) {
                throw new Error("Cupom não encontrado");
            }
            await this.couponRepository.delete(id);
        }
        catch (error) {
            console.error(`Erro ao excluir cupom ${id}:`, error);
            throw new Error(`Erro ao excluir cupom: ${error}`);
        }
    }
}
exports.CouponService = CouponService;
//# sourceMappingURL=CouponService.js.map