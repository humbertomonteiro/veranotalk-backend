"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCheckoutUseCase = void 0;
const mercadopago_1 = require("mercadopago");
const entities_1 = require("../../entities");
const errors_1 = require("../../../utils/errors");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const production = true;
const accessToken = production
    ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PRODUCTION || "SUA_CHAVE_AQUI"
    : process.env.MERCADO_PAGO_ACCESS_TOKEN_SANDBOX || "SUA_CHAVE_AQUI";
const mercadoPagoClient = new mercadopago_1.MercadoPagoConfig({
    accessToken: accessToken,
    options: {
        integratorId: "dev_c6a5b0e1720711f08601a2fe03ffde10",
    },
});
const preferenceClient = new mercadopago_1.Preference(mercadoPagoClient);
class CreateCheckoutUseCase {
    constructor(checkoutRepository, participantRepository, couponRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
        this.couponRepository = couponRepository;
    }
    async execute(input) {
        let checkout;
        let checkoutId;
        try {
            if (!input.participants.length) {
                throw new errors_1.ValidationError("Pelo menos um participante é obrigatório");
            }
            // Validar número mínimo de ingressos para lote 2
            if (input.checkout.metadata?.ticketType === "2" &&
                input.checkout.fullTickets < 5) {
                throw new errors_1.ValidationError("Mínimo de 5 ingressos para o lote de grupo");
            }
            // Calcular o valor total antes do desconto
            const originalAmount = this.calculateTotalAmount(input.checkout.fullTickets, input.checkout.halfTickets, input.checkout.metadata?.ticketType);
            // Validar e aplicar cupom, se fornecido
            let totalAmount = originalAmount;
            let discountAmount = 0;
            let coupon = null;
            if (input.checkout.couponCode) {
                // Proibir cupons para 5 ou mais ingressos
                if (input.checkout.fullTickets >= 5) {
                    throw new errors_1.ValidationError("Cupons não são permitidos para 5 ou mais ingressos");
                }
                coupon = await this.couponRepository.findByCode(input.checkout.couponCode);
                if (!coupon) {
                    throw new errors_1.ValidationError("Cupom inválido");
                }
                coupon.isValid(input.checkout.metadata?.eventId);
                // Calculate discount to match frontend logic
                if (coupon.discountType === "fixed") {
                    discountAmount = coupon.discountValue * input.checkout.fullTickets;
                }
                else if (coupon.discountType === "percentage") {
                    discountAmount = originalAmount * (coupon.discountValue / 100);
                }
                totalAmount = Math.max(0, originalAmount - discountAmount);
                // coupon.incrementUses();
                // await this.couponRepository.update(coupon);
            }
            // Criar checkout com informações do cupom
            const checkoutProps = {
                ...input.checkout,
                status: "pending",
                totalAmount,
                originalAmount,
                discountAmount,
                couponCode: coupon?.code || null,
                metadata: {
                    participantIds: [],
                    eventId: input.checkout.metadata?.eventId || "verano-talk-2025",
                    ticketType: input.checkout.metadata?.ticketType || "1",
                },
            };
            checkout = new entities_1.Checkout(checkoutProps);
            checkoutId = await this.checkoutRepository.save(checkout);
            console.log(`Checkout salvo com ID: ${checkoutId}`);
            // Atualizar checkout com ID
            checkout = new entities_1.Checkout({ ...checkoutProps, id: checkoutId });
            // Criar e salvar participantes com checkoutId
            const participants = input.participants.map((props) => new entities_1.Participant({
                ...props,
                eventId: props.eventId || "verano-talk-2025",
                checkoutId: checkoutId || "",
            }));
            const participantIds = [];
            for (const participant of participants) {
                participant.generateQrCode();
                const participantId = await this.participantRepository.save(participant);
                participantIds.push(participantId);
            }
            // Atualizar checkout com participantIds
            checkout.addParticipants(participantIds);
            checkout.startProcessing();
            await this.checkoutRepository.update(checkout);
            console.log(`Checkout atualizado para processing: ${checkoutId}`);
            // Criar preferência de pagamento no Mercado Pago
            const preference = {
                items: [
                    {
                        id: `item-${checkoutId}`,
                        title: `${input.checkout.fullTickets} Ingressos para evento ${input.checkout.metadata?.eventId || "Verano Talk"}`,
                        unit_price: checkout.totalAmount,
                        quantity: 1,
                    },
                ],
                payer: {
                    email: participants[0]?.email || "no-reply@veranotalk.com",
                },
                payment_methods: {
                    installments: 12,
                },
                external_reference: checkoutId,
                back_urls: {
                    success: "https://veranotalk.com.br/success",
                },
                auto_return: "approved",
            };
            const preferenceResponse = await preferenceClient.create({
                body: preference,
            });
            if (!preferenceResponse.init_point || !preferenceResponse.id) {
                console.error("Resposta do Mercado Pago inválida:", preferenceResponse);
                checkout.fail(new errors_1.InternalServerError("Resposta do Mercado Pago inválida: init_point ou id ausente"));
                await this.checkoutRepository.update(checkout);
                throw new errors_1.InternalServerError("Resposta do Mercado Pago inválida: init_point ou id ausente");
            }
            // Atualizar checkout com Mercado Pago ID
            checkout.setMercadoPagoPreferenceId(preferenceResponse.id);
            await this.checkoutRepository.update(checkout);
            console.log(`Checkout atualizado com mercadoPagoPreferenceId: ${preferenceResponse.id}`);
            return {
                checkoutId,
                paymentUrl: preferenceResponse.init_point,
                status: checkout.status,
                dataCheckout: checkout.toDTO(),
            };
        }
        catch (error) {
            console.error("Erro no CreateCheckoutUseCase:", error);
            if (checkout && checkoutId) {
                checkout.fail(error instanceof Error
                    ? error
                    : new errors_1.InternalServerError("Erro desconhecido"));
                await this.checkoutRepository.update(checkout);
                console.log(`Checkout atualizado para failed: ${checkoutId}`);
            }
            throw error instanceof Error
                ? error
                : new errors_1.InternalServerError("Falha ao criar checkout");
        }
    }
    calculateTotalAmount(fullTickets, halfTickets, ticketType) {
        const basePrice = fullTickets >= 5
            ? 399
            : ticketType === "1"
                ? 499
                : ticketType === "2"
                    ? 399
                    : ticketType === "3"
                        ? 799
                        : 499;
        const valueTicketHalf = Number(process.env.HALF_TICKET_PRICE) || 249.5;
        return fullTickets * basePrice + halfTickets * valueTicketHalf;
    }
}
exports.CreateCheckoutUseCase = CreateCheckoutUseCase;
//# sourceMappingURL=CreateCheckoutUsecase.js.map