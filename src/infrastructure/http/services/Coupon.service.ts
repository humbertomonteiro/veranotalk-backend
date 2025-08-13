import { CouponRepository } from "../../repositories/FirebaseCupon.repository";
import { Coupon } from "../../../domain/entities/Coupon";

export class CouponService {
  constructor(private readonly couponRepository: CouponRepository) {}

  async validateCoupon(code: string): Promise<Coupon | null> {
    const codeLowerCasw = code.toLowerCase();
    const coupon = await this.couponRepository.findByCode(codeLowerCasw);
    if (!coupon) {
      return null;
    }
    try {
      coupon.isValid();
      return coupon;
    } catch (error) {
      return null;
    }
  }
}
