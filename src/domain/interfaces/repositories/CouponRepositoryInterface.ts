import { Coupon } from "../../entities";

export interface CouponRepository {
  save(coupon: Coupon): Promise<string>;
  findById(id: string): Promise<Coupon | null>;
  findByCode(code: string): Promise<Coupon | null>;
  findAll(): Promise<Coupon[]>;
  update(coupon: Coupon): Promise<void>;
  delete(id: string): Promise<void>;
}
