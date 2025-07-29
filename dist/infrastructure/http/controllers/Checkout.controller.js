"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CheckoutController = void 0;
const usecases_1 = require("../../../domain/usecases");
class CheckoutController {
    constructor(checkoutService, checkoutRepository, participantRepository) {
        this.checkoutService = checkoutService;
        this.checkoutRepository = checkoutRepository;
        this.webhookUseCase = new usecases_1.WebhookMercadoPagoUseCase(checkoutRepository, participantRepository);
    }
    async createCheckout(req, res) {
        try {
            const input = req.body;
            // Validação básica
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
            await this.webhookUseCase.execute(input);
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
            const checkout = await this.checkoutRepository.findById(checkoutId);
            if (!checkout) {
                res.status(404).json({ error: "Checkout não encontrado" });
                return;
            }
            res.status(200).json(checkout);
        }
        catch (error) {
            console.error("Erro ao buscar checkout:", error);
            res.status(500).json({ error: "Erro ao buscar checkout" });
        }
    }
}
exports.CheckoutController = CheckoutController;
//# sourceMappingURL=Checkout.controller.js.map