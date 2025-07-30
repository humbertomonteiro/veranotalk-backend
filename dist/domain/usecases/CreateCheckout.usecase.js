"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCheckoutUseCase = void 0;
const mercadopago_1 = require("mercadopago");
const entities_1 = require("../entities");
const errors_1 = require("../../utils/errors");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const mercadoPagoClient = new mercadopago_1.MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "SUA_CHAVE_AQUI",
});
const preferenceClient = new mercadopago_1.Preference(mercadoPagoClient);
class CreateCheckoutUseCase {
    constructor(checkoutRepository, participantRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
    }
    async execute(input) {
        let checkout;
        let checkoutId;
        try {
            if (!input.participants.length) {
                throw new errors_1.ValidationError("Pelo menos um participante é obrigatório");
            }
            // Criar checkout primeiro
            const checkoutProps = {
                ...input.checkout,
                status: "pending",
                metadata: {
                    participantIds: [],
                    eventId: input.checkout.metadata?.eventId || "verano-talk",
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
                eventId: props.eventId || "verano-talk",
                checkoutId: checkoutId || "", // Atribuir checkoutId diretamente
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
                        title: `Ingressos para evento ${input.checkout.metadata?.eventId || "event-1018"}`,
                        unit_price: checkout.totalAmount,
                        quantity: 1,
                    },
                ],
                payer: {
                    email: participants[0]?.email || "no-reply@veranotalk.com",
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
            checkout.setMercadoPagoId(preferenceResponse.id);
            await this.checkoutRepository.update(checkout);
            console.log(`Checkout atualizado com mercadoPagoId: ${preferenceResponse.id}`);
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
}
exports.CreateCheckoutUseCase = CreateCheckoutUseCase;
//# sourceMappingURL=CreateCheckout.usecase.js.map