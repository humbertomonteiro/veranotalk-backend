"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookMercadoPagoUseCase = void 0;
const mercadopago_1 = require("mercadopago");
const sendEmail_utils_1 = require("../../utils/sendEmail.utils");
const logger_1 = __importDefault(require("../../utils/logger"));
class WebhookMercadoPagoUseCase {
    constructor(checkoutRepository, participantRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
    }
    async execute(input) {
        const mercadoPagoId = input.data.id;
        try {
            logger_1.default.info("Processando webhook", {
                mercadoPagoId,
                action: input.action,
            });
            // Ignorar eventos não relevantes
            if (!["payment.created", "payment.updated"].includes(input.action)) {
                logger_1.default.info("Evento ignorado", { action: input.action, mercadoPagoId });
                return;
            }
            // Configurar cliente do Mercado Pago
            const client = new mercadopago_1.MercadoPagoConfig({
                accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
            });
            const paymentClient = new mercadopago_1.Payment(client);
            // Consultar o status do pagamento
            const payment = await paymentClient.get({ id: Number(mercadoPagoId) });
            const status = payment.status; // Ex.: "approved", "pending", "rejected"
            const externalReference = payment.external_reference; // checkoutId
            const paymentMethodId = payment.payment_method_id; // Ex.: "visa", "pix", "bolbradesco"
            const payerFirstName = payment.payer?.first_name || "";
            const payerLastName = payment.payer?.last_name || "";
            const payerDocument = payment.payer?.identification?.number || "";
            const payerName = `${payerFirstName} ${payerLastName}`.trim() || "Desconhecido";
            logger_1.default.info("Status do pagamento obtido", {
                payment,
            });
            // Mapear status do Mercado Pago para CheckoutStatus
            let checkoutStatus;
            switch (status) {
                case "approved":
                    checkoutStatus = "approved";
                    break;
                case "pending":
                case "in_process":
                    checkoutStatus = "pending";
                    break;
                case "rejected":
                case "cancelled":
                    checkoutStatus = "rejected";
                    break;
                default:
                    logger_1.default.error("Status desconhecido do Mercado Pago", {
                        status,
                        mercadoPagoId,
                    });
                    throw new Error(`Status desconhecido do Mercado Pago: ${status}`);
            }
            // Mapear payment_method_id para paymentMethod
            let paymentMethod;
            switch (paymentMethodId) {
                case "visa":
                case "master":
                case "amex":
                case "elo":
                case "debelo":
                    paymentMethod = "credit_card";
                    break;
                case "pix":
                    paymentMethod = "pix";
                    break;
                case "bolbradesco":
                case "bolsantander":
                    paymentMethod = "boleto";
                    break;
                default:
                    paymentMethod = paymentMethodId || "unknown";
                    logger_1.default.warn("Método de pagamento desconhecido", {
                        paymentMethodId,
                        mercadoPagoId,
                    });
            }
            // Tentar encontrar o checkout
            let checkout = null;
            let attempts = 3;
            while (attempts > 0) {
                // if (input.action === "payment.created" && externalReference) {
                // Para payment.created, buscar pelo external_reference (checkoutId)
                if (!externalReference)
                    throw new Error("External reference not fuound!");
                logger_1.default.info("External Reference obtido", {
                    externalReference,
                });
                checkout = await this.checkoutRepository.findById(externalReference);
                // } else {
                //   // Para payment.updated, buscar pelo mercadoPagoId
                //   checkout = await this.checkoutRepository.findByMercadoPagoId(
                //     mercadoPagoId
                //   );
                // }
                if (checkout) {
                    logger_1.default.info("Checkout encontrado", {
                        checkoutId: checkout.id,
                        mercadoPagoId,
                        externalReference,
                        paymentMethod,
                        payerName,
                        payerDocument,
                    });
                    // Atualizar mercadoPagoId, paymentMethod e payer se for payment.created
                    if (input.action === "payment.created") {
                        if (!checkout.mercadoPagoId) {
                            checkout.setMercadoPagoId(mercadoPagoId);
                            logger_1.default.info("Checkout atualizado com mercadoPagoId", {
                                checkoutId: checkout.id,
                                mercadoPagoId,
                            });
                        }
                        if (!checkout.paymentMethod ||
                            checkout.paymentMethod !== paymentMethod) {
                            checkout.setPaymentMethod(paymentMethod);
                            logger_1.default.info("Checkout atualizado com paymentMethod", {
                                checkoutId: checkout.id,
                                paymentMethod,
                            });
                        }
                        if (!checkout.payer?.name || !checkout.payer?.document) {
                            checkout.setPayer({ name: payerName, document: payerDocument });
                            logger_1.default.info("Checkout atualizado com payer", {
                                checkoutId: checkout.id,
                                payerName,
                                payerDocument,
                            });
                        }
                    }
                    // Atualizar status do checkout
                    checkout.updateStatus(checkoutStatus);
                    await this.checkoutRepository.update(checkout);
                    logger_1.default.info("Checkout atualizado", {
                        checkoutId: checkout.id,
                        status: checkoutStatus,
                        mercadoPagoId,
                        paymentMethod,
                        payerName,
                        payerDocument,
                    });
                    // Enviar notificações para participantes se aprovado
                    if (checkoutStatus === "approved") {
                        if (!checkout.id) {
                            logger_1.default.error("Checkout id não encontrado", { mercadoPagoId });
                            throw new Error("Checkout id not found");
                        }
                        const participants = await this.participantRepository.findByCheckoutId(checkout.id);
                        for (const participant of participants) {
                            try {
                                await (0, sendEmail_utils_1.sendConfirmationEmail)(participant, checkout);
                                logger_1.default.info("E-mail de confirmação enviado", {
                                    email: participant.email,
                                    checkoutId: checkout.id,
                                });
                            }
                            catch (error) {
                                logger_1.default.error("Falha ao enviar e-mail", {
                                    email: participant.email,
                                    error: error instanceof Error
                                        ? error.message
                                        : "Erro desconhecido",
                                });
                            }
                        }
                    }
                    return;
                }
                logger_1.default.warn("Checkout não encontrado, retrying", {
                    mercadoPagoId,
                    externalReference,
                    attempt: 4 - attempts,
                });
                attempts--;
                await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo
            }
            logger_1.default.error("Checkout não encontrado após 3 tentativas", {
                mercadoPagoId,
                externalReference,
            });
            throw new Error(`Checkout não encontrado para mercadoPagoId: ${mercadoPagoId}, externalReference: ${externalReference}`);
        }
        catch (error) {
            logger_1.default.error("Erro ao processar webhook", {
                mercadoPagoId,
                action: input.action,
                error: error instanceof Error ? error.message : "Erro desconhecido",
            });
            throw error;
        }
    }
}
exports.WebhookMercadoPagoUseCase = WebhookMercadoPagoUseCase;
//# sourceMappingURL=WebhookMercadoPago.usecase.js.map