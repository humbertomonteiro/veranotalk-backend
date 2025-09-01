import {
  CheckoutRepository,
  ParticipantRepository,
} from "../../interfaces/repositories";
import { ValidationError, InternalServerError } from "../../../utils/errors";

interface DeleteCheckoutInput {
  checkoutId: string;
}

interface DeleteCheckoutOutput {
  message: string;
  deletedCheckoutId: string;
  deletedParticipantIds: string[];
}

export class DeleteCheckoutUseCase {
  constructor(
    private checkoutRepository: CheckoutRepository,
    private participantRepository: ParticipantRepository
  ) {}

  async execute(input: DeleteCheckoutInput): Promise<DeleteCheckoutOutput> {
    const { checkoutId } = input;

    try {
      // Verificar se o checkout existe
      const checkout = await this.checkoutRepository.findById(checkoutId);
      if (!checkout) {
        throw new ValidationError(
          `Checkout com ID ${checkoutId} não encontrado`
        );
      }

      // Recuperar participantIds do checkout
      const participantIds = checkout.metadata?.participantIds || [];
      const deletedParticipantIds: string[] = [];

      // Excluir cada participante associado
      for (const participantId of participantIds) {
        try {
          const participant = await this.participantRepository.findById(
            participantId
          );
          if (participant) {
            await this.participantRepository.delete(participantId);
            deletedParticipantIds.push(participantId);
            console.log(`Participante ${participantId} excluído com sucesso`);
          } else {
            console.warn(
              `Participante ${participantId} não encontrado, pulando exclusão`
            );
          }
        } catch (error) {
          console.error(
            `Erro ao excluir participante ${participantId}:`,
            error
          );
          throw new InternalServerError(
            `Falha ao excluir participante ${participantId}`
          );
        }
      }

      // Excluir o checkout
      try {
        await this.checkoutRepository.delete(checkoutId);
        console.log(`Checkout ${checkoutId} excluído com sucesso`);
      } catch (error) {
        console.error(`Erro ao excluir checkout ${checkoutId}:`, error);
        // Reverter exclusões de participantes, se possível
        for (const participantId of deletedParticipantIds) {
          console.warn(
            `Reversão não implementada para participante ${participantId}`
          );
        }
        throw new InternalServerError(
          `Falha ao excluir checkout ${checkoutId}`
        );
      }

      return {
        message: "Checkout e participantes associados excluídos com sucesso",
        deletedCheckoutId: checkoutId,
        deletedParticipantIds,
      };
    } catch (error) {
      console.error("Erro no DeleteCheckoutUseCase:", error);
      throw error instanceof Error
        ? error
        : new InternalServerError("Falha ao excluir checkout");
    }
  }
}

export { DeleteCheckoutInput, DeleteCheckoutOutput };
