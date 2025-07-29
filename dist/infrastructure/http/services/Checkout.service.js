"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
class CheckoutService {
    constructor(createCheckoutUseCase) {
        this.createCheckoutUseCase = createCheckoutUseCase;
    }
    async createCheckout(input) {
        return this.createCheckoutUseCase.execute(input);
    }
}
exports.CheckoutService = CheckoutService;
//# sourceMappingURL=Checkout.service.js.map