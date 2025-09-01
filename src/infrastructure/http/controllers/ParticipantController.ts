import { Request, Response } from "express";
import { ParticipantService } from "../services";
import { AppError } from "../../../utils/errors";
import { CheckoutStatus } from "../../../domain/entities";

interface UpdateRequestBody {
  name?: string;
  email?: string;
  phone?: string;
  ticketType?: string;
  status?: CheckoutStatus;
  paymentMethod?: string;
  totalAmount?: number;
  repo?: "participant" | "checkout" | "both";
}

export class ParticipantController {
  constructor(private participantService: ParticipantService) {}

  async getParticipantByDocument(req: Request, res: Response): Promise<void> {
    try {
      const document = req.params.document;
      console.log(`Buscando participante com documento: ${document}`);
      const { participant, checkout } =
        await this.participantService.getParticipantByDocument(document);
      res.status(200).json({
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          phone: participant.phone,
          document: participant.document,
          ticketType: participant.ticketType,
          checkedIn: participant.checkedIn,
          qrCode: participant.qrCode,
          eventId: participant.eventId,
        },
        checkout: checkout
          ? {
              id: checkout.id,
              status: checkout.status,
              totalAmount: checkout.totalAmount,
              metadata: checkout.metadata,
              createdAt:
                checkout.createdAt && !isNaN(checkout.createdAt.getTime())
                  ? checkout.createdAt.toISOString()
                  : new Date().toISOString(),
              updatedAt:
                checkout.updatedAt && !isNaN(checkout.updatedAt.getTime())
                  ? checkout.updatedAt.toISOString()
                  : new Date().toISOString(),
            }
          : null,
      });
    } catch (error) {
      console.error("Erro ao buscar participante por documento:", error);
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

  async updateParticipant(req: Request, res: Response): Promise<void> {
    try {
      const { uid } = req.params;
      const {
        name,
        email,
        phone,
        ticketType,
        status,
        paymentMethod,
        totalAmount,
        repo = "both",
      } = req.body as UpdateRequestBody;

      if (
        !name &&
        !email &&
        !phone &&
        !ticketType &&
        !status &&
        !paymentMethod &&
        totalAmount === undefined
      ) {
        res.status(400).json({
          error:
            "Pelo menos um campo deve ser fornecido (name, email, phone, ticketType, status, paymentMethod, totalAmount)",
        });
        return;
      }

      const result = await this.participantService.updateParticipant(
        uid,
        {
          name,
          email,
          phone,
          ticketType,
          status,
          paymentMethod,
          totalAmount,
        },
        repo
      );

      const response: { message: string; participant?: any; checkout?: any } = {
        message: "Update successful",
      };
      if (result.participant) {
        response.participant = result.participant.toDTO();
      }
      if (result.checkout) {
        response.checkout = result.checkout.toDTO();
      }

      res.status(200).json(response);
    } catch (error) {
      console.error(
        `Erro ao atualizar participante/checkout com UID ${req.params.uid}:`,
        error
      );
      res.status(400).json({
        error:
          error instanceof Error ? error.message : "Erro ao atualizar dados",
      });
    }
  }
}
