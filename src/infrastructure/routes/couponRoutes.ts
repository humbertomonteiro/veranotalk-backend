import { Router } from "express";
import { CouponController } from "../http/controllers";
import { CouponService } from "../http/services";
import { FirebaseCouponRepository } from "../repositories";

const router = Router();
const couponRepository = new FirebaseCouponRepository();
const couponService = new CouponService(couponRepository);
const controller = new CouponController(couponService);

router.post("/", controller.createCoupon.bind(controller));
router.post("/validate", controller.validateCoupon.bind(controller));
router.get("/", controller.getAllCoupons.bind(controller));
router.put("/:id", controller.updateCoupon.bind(controller));
router.delete("/:id", controller.deleteCoupon.bind(controller));

export { router as couponRoutes };
