"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
class CheckoutService {
    constructor(createCheckoutUseCase, webhookUseCase, checkoutRepository) {
        this.createCheckoutUseCase = createCheckoutUseCase;
        this.webhookUseCase = webhookUseCase;
        this.checkoutRepository = checkoutRepository;
    }
    async createCheckout(input) {
        return this.createCheckoutUseCase.execute(input);
    }
    async handleWebhook(input) {
        await this.webhookUseCase.execute(input);
    }
    async getCheckoutById(checkoutId) {
        const checkout = await this.checkoutRepository.findById(checkoutId);
        if (!checkout) {
            throw new Error("Checkout não encontrado");
        }
        return checkout;
    }
}
exports.CheckoutService = CheckoutService;
//# sourceMappingURL=Checkout.service.js.map