"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponService = void 0;
class CouponService {
    constructor(couponRepository) {
        this.couponRepository = couponRepository;
    }
    async validateCoupon(code) {
        const codeLowerCasw = code.toLowerCase();
        const coupon = await this.couponRepository.findByCode(codeLowerCasw);
        if (!coupon) {
            return null;
        }
        try {
            coupon.isValid();
            return coupon;
        }
        catch (error) {
            return null;
        }
    }
}
exports.CouponService = CouponService;
//# sourceMappingURL=Coupon.service.js.map