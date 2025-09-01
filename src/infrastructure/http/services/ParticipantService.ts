import {
  ParticipantRepository,
  CheckoutRepository,
} from "../../../domain/interfaces/repositories";
import {
  Participant,
  Checkout,
  CheckoutStatus,
} from "../../../domain/entities";
import { NotFoundError, ValidationError } from "../../../utils/errors";
import { UpdateParticipantUsecase } from "../../../domain/usecases";

interface UpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  ticketType?: string;
  status?: CheckoutStatus;
  paymentMethod?: string;
  totalAmount?: number;
}

interface ParticipantWithCheckout {
  participant: Participant;
  checkout: Checkout | null;
}

export class ParticipantService {
  private updateCheckoutUsecase: UpdateParticipantUsecase;
  constructor(
    private participantRepository: ParticipantRepository,
    private checkoutRepository: CheckoutRepository
  ) {
    this.updateCheckoutUsecase = new UpdateParticipantUsecase(
      checkoutRepository,
      participantRepository
    );
  }

  async getParticipantByDocument(
    document: string
  ): Promise<ParticipantWithCheckout> {
    if (!document) {
      throw new ValidationError("CPF é obrigatório");
    }

    const participant = await this.participantRepository.findByDocument(
      document
    );
    if (!participant) {
      throw new NotFoundError("Participante não encontrado");
    }

    let checkout: Checkout | null = null;
    if (participant.checkoutId) {
      checkout = await this.checkoutRepository.findById(participant.checkoutId);
    }

    return { participant, checkout };
  }

  async validateQRCode(
    participantId: string,
    qrCode: string
  ): Promise<boolean> {
    if (!participantId || !qrCode) {
      throw new ValidationError("participantId e qrCode são obrigatórios");
    }

    const participant = await this.participantRepository.findById(
      participantId
    );
    if (!participant) {
      throw new NotFoundError("Participante não encontrado");
    }

    if (!participant.qrCode || participant.qrCode !== qrCode) {
      throw new ValidationError("QR Code inválido");
    }

    if (participant.checkedIn) {
      throw new ValidationError("Participante já fez check-in");
    }

    participant.checkIn();
    await this.participantRepository.update(participant);
    return true;
  }

  async getCertificate(
    participantId: string
  ): Promise<{ available: boolean; url?: string }> {
    if (!participantId) {
      throw new ValidationError("participantId é obrigatório");
    }

    const participant = await this.participantRepository.findById(
      participantId
    );
    if (!participant) {
      throw new NotFoundError("Participante não encontrado");
    }

    if (!participant.checkoutId) {
      return { available: false };
    }

    const checkout = await this.checkoutRepository.findById(
      participant.checkoutId
    );
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

  async updateParticipant(
    uid: string,
    input: UpdateInput,
    repo: "participant" | "checkout" | "both" = "both"
  ): Promise<{ participant?: Participant; checkout?: Checkout }> {
    try {
      // Validate input
      if (input.email && !/\S+@\S+\.\S+/.test(input.email)) {
        throw new Error("E-mail inválido");
      }
      if (input.name && !input.name.trim()) {
        throw new Error("Nome não pode estar vazio");
      }
      if (
        input.paymentMethod &&
        !["pix", "credit_card", "boleto"].includes(input.paymentMethod)
      ) {
        throw new Error("Método de pagamento inválido");
      }

      if (input.totalAmount !== undefined && input.totalAmount < 0) {
        throw new Error("Valor total não pode ser negativo");
      }

      const result = await this.updateCheckoutUsecase.execute(uid, repo, input);
      return result;
    } catch (error) {
      console.error(
        `Erro ao atualizar participante/checkout com UID ${uid}:`,
        error
      );
      throw error instanceof Error
        ? error
        : new Error("Failed to update participant/checkout");
    }
  }
}
