import {
  Participant,
  ParticipantProps,
  Checkout,
  CheckoutProps,
  CheckoutStatus,
} from "../../entities";
import {
  CheckoutRepository,
  ParticipantRepository,
} from "../../interfaces/repositories";

interface CheckoutOrParticipantData {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  status?: CheckoutStatus;
  paymentMethod?: string;
  totalAmount?: number;
}

export class UpdateParticipantUsecase {
  constructor(
    private checkoutRepository: CheckoutRepository,
    private participantRepository: ParticipantRepository
  ) {}

  async execute(
    uid: string,
    repo: "participant" | "checkout" | "both",
    input: CheckoutOrParticipantData
  ): Promise<{ participant?: Participant; checkout?: Checkout }> {
    const participantUid = await this.participantRepository.findById(uid);
    if (!participantUid) {
      throw new Error("Participant not found");
    }
    try {
      if (repo === "participant" || repo === "both") {
        const updateParticipantProps: ParticipantProps = {
          ...participantUid.toDTO(),
          name: input.name ?? participantUid.name,
          email: input.email ?? participantUid.email,
          phone: input.phone ?? participantUid.phone,
          updatedAt: new Date(),
        };

        const updatedParticipant = new Participant(updateParticipantProps);
        await this.participantRepository.update(updatedParticipant);

        if (repo === "participant") {
          return { participant: updatedParticipant };
        }
      }

      if (repo === "checkout" || repo === "both") {
        const checkout = await this.checkoutRepository.findById(
          participantUid?.checkoutId
        );
        if (!checkout) {
          throw new Error("Checkout not found");
        }

        const updateCheckoutProps: CheckoutProps = {
          ...checkout.toDTO(),
          status: input.status ?? checkout.status,
          paymentMethod: input.paymentMethod ?? checkout.paymentMethod,
          totalAmount: input.totalAmount ?? checkout.totalAmount,
          updatedAt: new Date(),
        };

        const updatedCheckout = new Checkout(updateCheckoutProps);
        await this.checkoutRepository.update(updatedCheckout);

        if (repo === "checkout") {
          return { checkout: updatedCheckout };
        }

        const participant = await this.participantRepository.findById(uid);
        if (!participant) {
          throw new Error("Participant not found after checkout update");
        }

        return { participant, checkout: updatedCheckout };
      }

      throw new Error("Invalid repo parameter");
    } catch (error) {
      console.error(`Erro ao atualizar ${repo} com UID ${uid}:`, error);
      throw new Error(`Failed to update ${repo}`);
    }
  }
}
