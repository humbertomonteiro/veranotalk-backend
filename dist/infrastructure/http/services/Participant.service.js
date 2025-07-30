"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantService = void 0;
const errors_1 = require("../../../utils/errors");
class ParticipantService {
    constructor(participantRepository, checkoutRepository) {
        this.participantRepository = participantRepository;
        this.checkoutRepository = checkoutRepository;
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
}
exports.ParticipantService = ParticipantService;
//# sourceMappingURL=Participant.service.js.map