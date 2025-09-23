"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookMercadoPagoUseCase = void 0;
const mercadopago_1 = require("mercadopago");
const sendEmail_utils_1 = require("../../../utils/sendEmail.utils");
const logger_1 = __importDefault(require("../../../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const production = true;
const accessToken = production
    ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PRODUCTION || "SUA_CHAVE_AQUI"
    : process.env.MERCADO_PAGO_ACCESS_TOKEN_SANDBOX || "SUA_CHAVE_AQUI";
const webhookSecret = production
    ? process.env.MERCADO_PAGO_WEBHOOK_SECRET_PRODUCTION
    : process.env.MERCADO_PAGO_WEBHOOK_SECRET_SANDBOX;
class WebhookMercadoPagoUseCase {
    constructor(checkoutRepository, participantRepository, couponRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
        this.couponRepository = couponRepository;
    }
    async execute(input, xSignature, xRequestId, dataIdUrl) {
        const mercadoPagoId = input.data.id;
        this.validateXSignature(xSignature, dataIdUrl, xRequestId);
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
                accessToken: accessToken,
            });
            const paymentClient = new mercadopago_1.Payment(client);
            // Consultar o status do pagamento
            const payment = await paymentClient.get({ id: Number(mercadoPagoId) });
            const status = payment.status; //
            const externalReference = payment.external_reference;
            const paymentMethodId = payment.payment_method_id;
            const payerFirstName = payment.payer?.first_name || "";
            const payerLastName = payment.card?.cardholder?.name || payment.payer?.last_name || "";
            const payerDocument = payment.card?.cardholder?.identification?.number ||
                payment.payer?.identification?.number ||
                "";
            const payerName = `${payerFirstName} ${payerLastName}`.trim() || "Desconhecido";
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
                if (!externalReference) {
                    logger_1.default.error("External reference não encontrado", { mercadoPagoId });
                    throw new Error("External reference not found!");
                }
                logger_1.default.info("External Reference obtido", {
                    externalReference,
                });
                checkout = await this.checkoutRepository.findById(externalReference);
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
                        if (!checkout.mercadoPagoId ||
                            checkout.mercadoPagoId !== mercadoPagoId) {
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
                        if (checkout.couponCode) {
                            const coupon = await this.couponRepository.findByCode(checkout.couponCode);
                            if (coupon) {
                                coupon.incrementUses();
                                await this.couponRepository.update(coupon);
                                logger_1.default.info("Coupon usage incremented", {
                                    couponCode: checkout.couponCode,
                                    checkoutId: checkout.id,
                                });
                            }
                            else {
                                logger_1.default.warn("Coupon not found for checkout", {
                                    couponCode: checkout.couponCode,
                                    checkoutId: checkout.id,
                                });
                            }
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
                await new Promise((resolve) => setTimeout(resolve, 1000));
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
    validateXSignature(xSignature, dataIdUrl, xRequestId) {
        const parts = xSignature.split(",");
        let ts = null;
        let v1 = null;
        for (const part of parts) {
            const [key, value] = part.split("=").map((p) => p.trim());
            if (key === "ts")
                ts = value;
            if (key === "v1")
                v1 = value;
        }
        if (!ts || !v1) {
            throw new Error("Invalid x-signature header");
        }
        const idFormatted = /^[a-zA-Z0-9]+$/.test(dataIdUrl)
            ? dataIdUrl.toLowerCase()
            : dataIdUrl;
        const manifest = `id:${idFormatted};request-id:${xRequestId};ts:${ts};`;
        const secret = webhookSecret;
        if (!secret)
            throw new Error("Secret not found");
        const generatedHash = crypto_1.default
            .createHmac("sha256", secret)
            .update(manifest)
            .digest("hex");
        if (generatedHash === v1) {
            logger_1.default.info("Webhook verificado com sucesso");
        }
        else {
            logger_1.default.error("Assinatura inválida");
            throw new Error("Assinatura inválida");
        }
    }
}
exports.WebhookMercadoPagoUseCase = WebhookMercadoPagoUseCase;
//# sourceMappingURL=WebhookMercadoPagoUsecase.js.map