"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CouponController = void 0;
class CouponController {
    constructor(couponService) {
        this.couponService = couponService;
    }
    async validateCoupon(req, res) {
        try {
            const input = req.body;
            if (!input.code) {
                res.status(400).json({ error: "Código do cupom é obrigatório" });
                return;
            }
            const coupon = await this.couponService.validateCoupon(input.code);
            if (!coupon) {
                res.status(404).json({ error: "Cupom inválido ou não encontrado" });
                return;
            }
            // Calcular desconto, se totalAmount for fornecido
            let discountedAmount = input.totalAmount;
            let discount = 0;
            if (input.totalAmount !== undefined) {
                discountedAmount = coupon.apply(input.totalAmount); // Confia na validação da entidade
                discount = input.totalAmount - discountedAmount;
            }
            res.status(200).json({
                coupon: coupon.toDTO(),
                discountedAmount,
                discount,
            });
        }
        catch (error) {
            console.error("Erro ao validar cupom:", error);
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro ao validar cupom",
            });
        }
    }
}
exports.CouponController = CouponController;
//# sourceMappingURL=Coupon.controller.js.map