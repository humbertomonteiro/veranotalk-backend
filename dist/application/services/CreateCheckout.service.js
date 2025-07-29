"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCheckoutService = void 0;
class CreateCheckoutService {
    constructor(createCheckoutUseCase) {
        this.createCheckoutUseCase = createCheckoutUseCase;
    }
    async execute(input) {
        try {
            const checkout = await this.createCheckoutUseCase.execute(input);
            return checkout;
        }
        catch (error) {
            throw new Error(`Failed to create checkout: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
exports.CreateCheckoutService = CreateCheckoutService;
//# sourceMappingURL=CreateCheckout.service.js.map