"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutController = void 0;
class CheckoutController {
    constructor(checkoutService) {
        this.checkoutService = checkoutService;
    }
    async createCheckout(req, res) {
        try {
            const input = req.body;
            if (!input.participants || !input.checkout) {
                res.status(400).json({
                    error: "Dados de participantes e checkout são obrigatórios",
                });
                return;
            }
            const result = await this.checkoutService.createCheckout(input);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : "Erro desconhecido",
            });
        }
    }
    async handleWebhook(req, res) {
        try {
            const input = req.body;
            await this.checkoutService.handleWebhook(input);
            res.status(200).send("OK");
        }
        catch (error) {
            console.error("Erro ao processar webhook:", error);
            res.status(500).json({
                error: error instanceof Error ? error.message : "Erro ao processar webhook",
            });
        }
    }
    async getCheckoutById(req, res) {
        try {
            const checkoutId = req.params.id;
            console.log(`Fetching checkout with ID: ${checkoutId}`);
            const checkout = await this.checkoutService.getCheckoutById(checkoutId);
            if (!checkout) {
                res.status(404).json({ error: "Checkout not found" });
                return;
            }
            res.status(200).json(checkout.toDTO()); // Use toDTO() to return plain object
        }
        catch (error) {
            console.error("Erro ao buscar checkout:", error);
            res
                .status(error instanceof Error && error.message.includes("não encontrado")
                ? 404
                : 500)
                .json({
                error: error instanceof Error ? error.message : "Erro ao buscar checkout",
            });
        }
    }
}
exports.CheckoutController = CheckoutController;
//# sourceMappingURL=Checkout.controller.js.map