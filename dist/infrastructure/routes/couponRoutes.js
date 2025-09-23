"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRoutes = void 0;
const express_1 = require("express");
const controllers_1 = require("../http/controllers");
const services_1 = require("../http/services");
const repositories_1 = require("../repositories");
const router = (0, express_1.Router)();
exports.couponRoutes = router;
const couponRepository = new repositories_1.FirebaseCouponRepository();
const couponService = new services_1.CouponService(couponRepository);
const controller = new controllers_1.CouponController(couponService);
router.post("/", controller.createCoupon.bind(controller));
router.post("/validate", controller.validateCoupon.bind(controller));
router.get("/", controller.getAllCoupons.bind(controller));
router.put("/:id", controller.updateCoupon.bind(controller));
router.delete("/:id", controller.deleteCoupon.bind(controller));
//# sourceMappingURL=couponRoutes.js.map