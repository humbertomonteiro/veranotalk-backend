"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCheckoutUseCase = void 0;
const mercadopago_1 = require("mercadopago");
const entities_1 = require("../entities");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
// Configuração do cliente do Mercado Pago
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
            // 1. Criar e validar participantes
            const participants = input.participants.map((props) => new entities_1.Participant(props));
            const participantIds = [];
            // 2. Salvar participantes
            for (const participant of participants) {
                const participantId = await this.participantRepository.save(participant);
                participantIds.push(participantId);
            }
            // 3. Criar checkout
            const checkoutProps = {
                ...input.checkout,
                status: "pending",
                metadata: {
                    participantIds,
                    eventId: input.checkout.metadata?.eventId,
                },
            };
            checkout = new entities_1.Checkout(checkoutProps);
            // 4. Salvar checkout
            checkoutId = await this.checkoutRepository.save(checkout);
            console.log(`Checkout salvo com ID: ${checkoutId}`);
            // Atualizar o checkout com o ID gerado
            checkout = new entities_1.Checkout({ ...checkoutProps, id: checkoutId });
            // 5. Iniciar processamento
            checkout.startProcessing();
            await this.checkoutRepository.update(checkout);
            console.log(`Checkout atualizado para processing: ${checkoutId}`);
            // 6. Criar preferência de pagamento no Mercado Pago
            const preference = {
                items: [
                    {
                        id: `item-${checkoutId}`,
                        title: `Ingressos para evento ${input.checkout.metadata?.eventId || "desconhecido"}`,
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
                    //   failure: "https://sua-landing-page.com/failure",
                    //   pending: "https://sua-landing-page.com/pending",
                },
                auto_return: "approved",
            };
            const preferenceResponse = await preferenceClient.create({
                body: preference,
            });
            // Verificar se init_point e id estão presentes
            if (!preferenceResponse.init_point || !preferenceResponse.id) {
                console.error("Resposta do Mercado Pago inválida:", preferenceResponse);
                checkout.fail(new Error("Resposta do Mercado Pago inválida: init_point ou id ausente"));
                await this.checkoutRepository.update(checkout);
                throw new Error("Resposta do Mercado Pago inválida: init_point ou id ausente");
            }
            // 7. Atualizar checkout com Mercado Pago ID
            checkout.setMercadoPagoId(preferenceResponse.id);
            await this.checkoutRepository.update(checkout);
            console.log(`Checkout atualizado com mercadoPagoId: ${preferenceResponse.id}`);
            return {
                checkoutId,
                paymentUrl: preferenceResponse.init_point,
                status: checkout.status,
                dataCheckout: checkout,
            };
        }
        catch (error) {
            console.error("Erro no CreateCheckoutUseCase:", error);
            if (checkout && checkoutId) {
                // Atualizar o checkout existente com status failed
                checkout.fail(new Error(error instanceof Error ? error.message : "Erro desconhecido"));
                await this.checkoutRepository.update(checkout);
                console.log(`Checkout atualizado para failed: ${checkoutId}`);
            }
            throw new Error(`Falha ao criar checkout: ${error}`);
        }
    }
}
exports.CreateCheckoutUseCase = CreateCheckoutUseCase;
//# sourceMappingURL=CreateCheckout.usecase.js.map