"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCheckoutUseCase = void 0;
const errors_1 = require("../../../utils/errors");
class DeleteCheckoutUseCase {
    constructor(checkoutRepository, participantRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
    }
    async execute(input) {
        const { checkoutId } = input;
        try {
            // Verificar se o checkout existe
            const checkout = await this.checkoutRepository.findById(checkoutId);
            if (!checkout) {
                throw new errors_1.ValidationError(`Checkout com ID ${checkoutId} não encontrado`);
            }
            // Recuperar participantIds do checkout
            const participantIds = checkout.metadata?.participantIds || [];
            const deletedParticipantIds = [];
            // Excluir cada participante associado
            for (const participantId of participantIds) {
                try {
                    const participant = await this.participantRepository.findById(participantId);
                    if (participant) {
                        await this.participantRepository.delete(participantId);
                        deletedParticipantIds.push(participantId);
                        console.log(`Participante ${participantId} excluído com sucesso`);
                    }
                    else {
                        console.warn(`Participante ${participantId} não encontrado, pulando exclusão`);
                    }
                }
                catch (error) {
                    console.error(`Erro ao excluir participante ${participantId}:`, error);
                    throw new errors_1.InternalServerError(`Falha ao excluir participante ${participantId}`);
                }
            }
            // Excluir o checkout
            try {
                await this.checkoutRepository.delete(checkoutId);
                console.log(`Checkout ${checkoutId} excluído com sucesso`);
            }
            catch (error) {
                console.error(`Erro ao excluir checkout ${checkoutId}:`, error);
                // Reverter exclusões de participantes, se possível
                for (const participantId of deletedParticipantIds) {
                    console.warn(`Reversão não implementada para participante ${participantId}`);
                }
                throw new errors_1.InternalServerError(`Falha ao excluir checkout ${checkoutId}`);
            }
            return {
                message: "Checkout e participantes associados excluídos com sucesso",
                deletedCheckoutId: checkoutId,
                deletedParticipantIds,
            };
        }
        catch (error) {
            console.error("Erro no DeleteCheckoutUseCase:", error);
            throw error instanceof Error
                ? error
                : new errors_1.InternalServerError("Falha ao excluir checkout");
        }
    }
}
exports.DeleteCheckoutUseCase = DeleteCheckoutUseCase;
//# sourceMappingURL=DeleteCheckoutUsecase.js.map