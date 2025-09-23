"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantService = void 0;
const errors_1 = require("../../../utils/errors");
const usecases_1 = require("../../../domain/usecases");
class ParticipantService {
    constructor(participantRepository, checkoutRepository) {
        this.participantRepository = participantRepository;
        this.checkoutRepository = checkoutRepository;
        this.updateCheckoutUsecase = new usecases_1.UpdateParticipantUsecase(checkoutRepository, participantRepository);
    }
    async getParticipantByDocument(document) {
        if (!document) {
            throw new errors_1.ValidationError("CPF é obrigatório");
        }
        const participant = await this.participantRepository.findByDocument(document);
        if (!participant) {
            throw new errors_1.NotFoundError("Participante não encontrado");
        }
        let checkout = null;
        if (participant.checkoutId) {
            checkout = await this.checkoutRepository.findById(participant.checkoutId);
        }
        return { participant, checkout };
    }
    async validateQRCode(participantId, qrCode) {
        if (!participantId || !qrCode) {
            throw new errors_1.ValidationError("participantId e qrCode são obrigatórios");
        }
        const participant = await this.participantRepository.findById(participantId);
        if (!participant) {
            throw new errors_1.NotFoundError("Participante não encontrado");
        }
        if (!participant.qrCode || participant.qrCode !== qrCode) {
            throw new errors_1.ValidationError("QR Code inválido");
        }
        if (participant.checkedIn) {
            throw new errors_1.ValidationError("Participante já fez check-in");
        }
        participant.checkIn();
        await this.participantRepository.update(participant);
        return true;
    }
    async getCertificate(participantId) {
        if (!participantId) {
            throw new errors_1.ValidationError("participantId é obrigatório");
        }
        const participant = await this.participantRepository.findById(participantId);
        if (!participant) {
            throw new errors_1.NotFoundError("Participante não encontrado");
        }
        if (!participant.checkoutId) {
            return { available: false };
        }
        const checkout = await this.checkoutRepository.findById(participant.checkoutId);
        if (!checkout || checkout.status !== "approved") {
            return { available: false };
        }
        const eventDate = new Date("2025-07-29");
        const today = new Date();
        const certificateAvailable = today > eventDate;
        if (!certificateAvailable) {
            return { available: false };
        }
        const certificateUrl = `https://storage.googleapis.com/veranotalk-certificates/${participantId}.pdf`;
        return { available: true, url: certificateUrl };
    }
    async updateParticipant(uid, input, repo = "both") {
        try {
            // Validate input
            if (input.email && !/\S+@\S+\.\S+/.test(input.email)) {
                throw new Error("E-mail inválido");
            }
            if (input.name && !input.name.trim()) {
                throw new Error("Nome não pode estar vazio");
            }
            if (input.paymentMethod &&
                !["pix", "credit_card", "boleto"].includes(input.paymentMethod)) {
                throw new Error("Método de pagamento inválido");
            }
            if (input.totalAmount !== undefined && input.totalAmount < 0) {
                throw new Error("Valor total não pode ser negativo");
            }
            const result = await this.updateCheckoutUsecase.execute(uid, repo, input);
            return result;
        }
        catch (error) {
            console.error(`Erro ao atualizar participante/checkout com UID ${uid}:`, error);
            throw error instanceof Error
                ? error
                : new Error("Failed to update participant/checkout");
        }
    }
}
exports.ParticipantService = ParticipantService;
//# sourceMappingURL=ParticipantService.js.map