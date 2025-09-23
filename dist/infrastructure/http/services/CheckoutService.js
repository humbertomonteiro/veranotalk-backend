"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutService = void 0;
class CheckoutService {
    constructor(createCheckoutUseCase, createManualCheckoutUseCase, webhookUseCase, checkoutRepository, deleteCheckoutUseCase) {
        this.createCheckoutUseCase = createCheckoutUseCase;
        this.createManualCheckoutUseCase = createManualCheckoutUseCase;
        this.webhookUseCase = webhookUseCase;
        this.checkoutRepository = checkoutRepository;
        this.deleteCheckoutUseCase = deleteCheckoutUseCase;
    }
    async createCheckout(input) {
        return this.createCheckoutUseCase.execute(input);
    }
    async createManualCheckout(input) {
        return this.createManualCheckoutUseCase.execute(input);
    }
    async handleWebhook(input, xSignature, xRequestId, dataIdUrl) {
        if (!xSignature || !xRequestId || !dataIdUrl) {
            throw new Error("Missing headers or query params");
        }
        await this.webhookUseCase.execute(input, xSignature, xRequestId, dataIdUrl);
    }
    async getCheckoutById(checkoutId) {
        const checkout = await this.checkoutRepository.findById(checkoutId);
        if (!checkout) {
            throw new Error("Checkout não encontrado");
        }
        return checkout;
    }
    async deleteCheckout(checkoutId) {
        try {
            const input = { checkoutId };
            return await this.deleteCheckoutUseCase.execute(input);
        }
        catch (error) {
            console.error(`Erro ao excluir checkout ${checkoutId}:`, error);
            throw error;
        }
    }
}
exports.CheckoutService = CheckoutService;
//# sourceMappingURL=CheckoutService.js.map