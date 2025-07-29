"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
class PricingService {
    constructor(prices) {
        this.prices = prices || {
            full: Number(process.env.BASE_TICKET_PRICE),
            half: Number(process.env.HALF_TICKET_PRICE),
            vip: Number(process.env.VIP_TICKET_PRICE),
        };
    }
    getPrice(isHalfPrice = false) {
        return isHalfPrice ? this.prices.half : this.prices.full;
    }
    getAllPrices() {
        return { ...this.prices }; // Retorna cópia para evitar mutações
    }
}
exports.PricingService = PricingService;
//# sourceMappingURL=Pricing.service.js.map