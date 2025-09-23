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
    async createManualCheckout(req, res) {
        try {
            const input = req.body;
            if (!input.participants || !input.checkout || !input.userId) {
                res.status(400).json({
                    error: "Dados de participantes, userId e checkout são obrigatórios",
                });
                return;
            }
            // Validação adicional para checkout manual
            if (!input.checkout.paymentMethod) {
                res.status(400).json({
                    error: "Método de pagamento é obrigatório para checkout manual",
                });
                return;
            }
            const result = await this.checkoutService.createManualCheckout(input);
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
            const xSignature = req.header("x-signature");
            const xRequestId = req.header("x-request-id");
            const dataIdUrl = req.query["data.id"];
            await this.checkoutService.handleWebhook(input, xSignature, xRequestId, dataIdUrl);
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
            const checkout = await this.checkoutService.getCheckoutById(checkoutId);
            if (!checkout) {
                res.status(404).json({ error: "Checkout not found" });
                return;
            }
            res.status(200).json(checkout.toDTO());
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
    async deleteCheckout(req, res) {
        try {
            const checkoutId = req.params.id;
            if (!checkoutId) {
                res.status(400).json({ error: "ID do checkout é obrigatório" });
                return;
            }
            const result = await this.checkoutService.deleteCheckout(checkoutId);
            res.status(200).json(result);
        }
        catch (error) {
            console.error(`Erro ao excluir checkout ${req.params.id}:`, error);
            res
                .status(error instanceof Error && error.message.includes("não encontrado")
                ? 404
                : 500)
                .json({
                error: error instanceof Error ? error.message : "Erro ao excluir checkout",
            });
        }
    }
}
exports.CheckoutController = CheckoutController;
//# sourceMappingURL=CheckoutController.js.map