import {
  ParticipantRepository,
  CheckoutRepository,
} from "../../../domain/interfaces/repositories";
import { Participant, Checkout } from "../../../domain/entities";
import { NotFoundError, ValidationError } from "../../../utils/errors";

interface ParticipantWithCheckout {
  participant: Participant;
  checkout: Checkout | null;
}

export class ParticipantService {
  constructor(
    private participantRepository: ParticipantRepository,
    private checkoutRepository: CheckoutRepository
  ) {}

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
}
