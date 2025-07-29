"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseMercadoPagoRepository = void 0;
const mercadopago_1 = require("mercadopago");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class FirebaseMercadoPagoRepository {
    constructor() {
        this.MAX_RETRIES = 2;
        if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
            throw new Error("MERCADO_PAGO_ACCESS_TOKEN is not defined");
        }
        this.client = new mercadopago_1.MercadoPagoConfig({
            accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
            options: {
                timeout: 10000,
                idempotencyKey: "checkout-" + Date.now().toString(),
            },
        });
        this.preference = new mercadopago_1.Preference(this.client);
        this.payment = new mercadopago_1.Payment(this.client);
    }
    async createPreference(input) {
        return this.withRetry(async () => {
            this.validatePreferenceInput(input);
            const preferenceBody = {
                external_reference: input.externalReference,
                items: input.items.map((item) => ({
                    id: item.id,
                    title: item.title,
                    unit_price: item.unitPrice,
                    quantity: item.quantity,
                    description: item.description || `Ingresso ${item.title}`,
                    currency_id: "BRL",
                })),
                back_urls: input.backUrls,
                notification_url: input.notificationUrl,
                auto_return: "approved",
                expires: input.expires ?? true,
                expiration_date_from: input.expirationDate?.toISOString(),
                binary_mode: true,
            };
            const response = await this.preference.create({
                body: preferenceBody,
                requestOptions: { timeout: 8000 },
            });
            if (!response.id || !response.init_point) {
                throw new Error("Invalid preference response");
            }
            return {
                id: response.id,
                initPoint: response.init_point,
                sandboxInitPoint: response.sandbox_init_point || "",
            };
        });
    }
    async getPaymentStatus(paymentId) {
        return this.withRetry(async () => {
            const response = await this.payment.get({ id: paymentId });
            if (!response.id || !response.status) {
                throw new Error("Invalid payment response");
            }
            return {
                status: this.mapPaymentStatus(response.status),
                amount: response.transaction_amount || 0,
                paidAt: response.date_approved
                    ? new Date(response.date_approved)
                    : undefined,
            };
        });
    }
    async handleWebhook(event) {
        try {
            if (event.type !== "payment")
                return;
            const paymentStatus = await this.getPaymentStatus(event.data.id);
            // Aqui você pode adicionar lógica para notificar outros sistemas
            console.log(`Payment ${event.data.id} status: ${paymentStatus.status}`);
        }
        catch (error) {
            console.error("Error processing webhook:", error);
            throw error;
        }
    }
    // Métodos auxiliares
    async withRetry(operation) {
        let lastError = new Error("No attempts made");
        for (let i = 0; i <= this.MAX_RETRIES; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (i < this.MAX_RETRIES) {
                    await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }
        throw lastError;
    }
    validatePreferenceInput(input) {
        if (!input.externalReference) {
            throw new Error("External reference is required");
        }
        if (!input.items || input.items.length === 0) {
            throw new Error("At least one item is required");
        }
        if (input.items.some((item) => item.unitPrice <= 0)) {
            throw new Error("All items must have a positive price");
        }
    }
    mapPaymentStatus(status) {
        switch (status) {
            case "approved":
                return "approved";
            case "pending":
                return "pending";
            case "rejected":
                return "rejected";
            case "cancelled":
                return "cancelled";
            default:
                return "pending";
        }
    }
}
exports.FirebaseMercadoPagoRepository = FirebaseMercadoPagoRepository;
//# sourceMappingURL=FirebaseMercadoPago.repository.js.map