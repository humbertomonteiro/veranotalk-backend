import { Request, Response } from "express";
import { ParticipantService } from "../services/Participant.service";
import { AppError } from "../../../utils/errors";

export class ParticipantController {
  constructor(private participantService: ParticipantService) {}

  async getParticipantByDocument(req: Request, res: Response): Promise<void> {
    try {
      const document = req.params.document;
      const data = await this.participantService.getParticipantByDocument(
        document
      );
      res.status(200).json(data);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar participante" });
      }
    }
  }

  async validateQRCode(req: Request, res: Response): Promise<void> {
    try {
      const { participantId, qrCode } = req.body;
      const isValid = await this.participantService.validateQRCode(
        participantId,
        qrCode
      );
      res.status(200).json({ isValid });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao validar QR code" });
      }
    }
  }

  async getCertificate(req: Request, res: Response): Promise<void> {
    try {
      const participantId = req.params.participantId;
      const certificate = await this.participantService.getCertificate(
        participantId
      );
      res.status(200).json(certificate);
    } catch (error) {
      if (error instanceof AppError) {
        res.status(error.statusCode).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Erro ao buscar certificado" });
      }
    }
  }
}
