"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateManualCheckoutUseCase = void 0;
const entities_1 = require("../../entities");
const errors_1 = require("../../../utils/errors");
const sendEmail_utils_1 = require("../../../utils/sendEmail.utils");
const logger_1 = __importDefault(require("../../../utils/logger"));
class CreateManualCheckoutUseCase {
    constructor(checkoutRepository, participantRepository, couponRepository, userRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
        this.couponRepository = couponRepository;
        this.userRepository = userRepository;
    }
    async execute(input) {
        let checkout;
        let checkoutId;
        try {
            if (!input.participants.length) {
                throw new errors_1.ValidationError("Pelo menos um participante é obrigatório");
            }
            // Validar método de pagamento
            if (!input.checkout.paymentMethod) {
                throw new errors_1.ValidationError("Método de pagamento é obrigatório");
            }
            // Validar parcelas para cartão de crédito
            if (input.checkout.paymentMethod === "credit_card" &&
                (!input.checkout.installments || input.checkout.installments < 1)) {
                throw new errors_1.ValidationError("Número de parcelas é obrigatório para cartão de crédito");
            }
            // Calcular o valor total antes do desconto
            const originalAmount = this.calculateTotalAmount(input.checkout.fullTickets, input.checkout.halfTickets || 0);
            // Validar e aplicar cupom, se fornecido
            let totalAmount = originalAmount;
            let discountAmount = 0;
            let coupon = null;
            if (input.checkout.couponCode) {
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
            // Criar checkout manual (já aprovado)
            const checkoutProps = {
                ...input.checkout,
                status: "approved",
                totalAmount,
                originalAmount,
                discountAmount,
                couponCode: coupon?.code || null,
                paymentMethod: input.checkout.paymentMethod,
                metadata: {
                    participantIds: [],
                    eventId: input.checkout.metadata?.eventId || "verano-talk-2025",
                    manualPayment: true,
                    ...input.checkout.metadata,
                },
            };
            checkout = new entities_1.Checkout(checkoutProps);
            checkoutId = await this.checkoutRepository.save(checkout);
            logger_1.default.info(`Checkout manual salvo com ID: ${checkoutId}`);
            // Atualizar checkout com ID
            checkout = new entities_1.Checkout({ ...checkoutProps, id: checkoutId });
            if (input.userId) {
                const user = await this.userRepository.findById(input.userId);
                if (!user) {
                    throw new Error("User not found");
                }
                let valueSold = user?.valueSold;
                const updatedUserProps = {
                    ...user?.toDTO(),
                    valueSold: valueSold ? (valueSold += totalAmount) : totalAmount,
                };
                const updatedUser = new entities_1.User(updatedUserProps);
                await this.userRepository.update(updatedUser);
            }
            else {
                console.log("UserId not found:" + input.userId);
            }
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
            await this.checkoutRepository.update(checkout);
            logger_1.default.info(`Checkout manual atualizado com participantes: ${checkoutId}`);
            // ENVIO DE EMAILS DE CONFIRMAÇÃO - NOVA PARTE
            await this.sendConfirmationEmails(checkout, participants);
            return {
                checkoutId,
                status: checkout.status,
                dataCheckout: checkout.toDTO(),
                participantIds,
            };
        }
        catch (error) {
            logger_1.default.error("Erro no CreateManualCheckoutUseCase:", {
                error: error instanceof Error ? error.message : "Erro desconhecido",
                checkoutId,
            });
            if (checkout && checkoutId) {
                // Em caso de erro, marcar como failed mesmo sendo manual
                checkout.updateStatus("failed");
                await this.checkoutRepository.update(checkout);
                logger_1.default.warn(`Checkout manual atualizado para failed: ${checkoutId}`);
            }
            throw error instanceof Error
                ? error
                : new errors_1.InternalServerError("Falha ao criar checkout manual");
        }
    }
    async sendConfirmationEmails(checkout, participants) {
        try {
            logger_1.default.info("Iniciando envio de emails de confirmação", {
                checkoutId: checkout.id,
                totalParticipants: participants.length,
            });
            const emailPromises = participants.map(async (participant) => {
                try {
                    await (0, sendEmail_utils_1.sendConfirmationEmail)(participant, checkout);
                    logger_1.default.info("E-mail de confirmação enviado com sucesso", {
                        email: participant.email,
                        participantId: participant.id,
                        checkoutId: checkout.id,
                    });
                    return { success: true, email: participant.email };
                }
                catch (emailError) {
                    logger_1.default.error("Falha ao enviar e-mail de confirmação", {
                        email: participant.email,
                        error: emailError instanceof Error
                            ? emailError.message
                            : "Erro desconhecido",
                        checkoutId: checkout.id,
                    });
                    return {
                        success: false,
                        email: participant.email,
                        error: emailError,
                    };
                }
            });
            const results = await Promise.allSettled(emailPromises);
            // Log dos resultados
            const successfulEmails = results.filter((result) => result.status === "fulfilled" && result.value.success).length;
            const failedEmails = results.length - successfulEmails;
            logger_1.default.info("Resumo do envio de emails", {
                checkoutId: checkout.id,
                total: participants.length,
                successful: successfulEmails,
                failed: failedEmails,
            });
            if (failedEmails > 0) {
                logger_1.default.warn("Alguns emails falharam no envio", {
                    checkoutId: checkout.id,
                    failedCount: failedEmails,
                });
                // Não lançamos erro aqui porque o checkout já foi criado com sucesso
                // Os emails falhados podem ser reenviados manualmente ou tratados separadamente
            }
        }
        catch (error) {
            logger_1.default.error("Erro inesperado no processo de envio de emails", {
                error: error instanceof Error ? error.message : "Erro desconhecido",
                checkoutId: checkout.id,
            });
            // Não lançamos o erro para não falhar o checkout completo
            // O checkout foi criado com sucesso, apenas o email falhou
        }
    }
    calculateTotalAmount(fullTickets, halfTickets) {
        const valueTicketAll = Number(process.env.BASE_TICKET_PRICE) || 499;
        const valueTicketHalf = Number(process.env.HALF_TICKET_PRICE) || 249.5;
        return fullTickets * valueTicketAll + halfTickets * valueTicketHalf;
    }
}
exports.CreateManualCheckoutUseCase = CreateManualCheckoutUseCase;
//# sourceMappingURL=CreateManualCheckoutUsecase.js.map