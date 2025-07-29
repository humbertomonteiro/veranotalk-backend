"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantController = void 0;
const errors_1 = require("../../../utils/errors");
class ParticipantController {
    constructor(participantService) {
        this.participantService = participantService;
    }
    async getParticipantByDocument(req, res) {
        try {
            const document = req.params.document;
            const data = await this.participantService.getParticipantByDocument(document);
            res.status(200).json(data);
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Erro ao buscar participante" });
            }
        }
    }
    async validateQRCode(req, res) {
        try {
            const { participantId, qrCode } = req.body;
            const isValid = await this.participantService.validateQRCode(participantId, qrCode);
            res.status(200).json({ isValid });
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Erro ao validar QR code" });
            }
        }
    }
    async getCertificate(req, res) {
        try {
            const participantId = req.params.participantId;
            const certificate = await this.participantService.getCertificate(participantId);
            res.status(200).json(certificate);
        }
        catch (error) {
            if (error instanceof errors_1.AppError) {
                res.status(error.statusCode).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: "Erro ao buscar certificado" });
            }
        }
    }
}
exports.ParticipantController = ParticipantController;
//# sourceMappingURL=Participant.controller.js.map