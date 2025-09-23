"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateParticipantUsecase = void 0;
const entities_1 = require("../../entities");
class UpdateParticipantUsecase {
    constructor(checkoutRepository, participantRepository) {
        this.checkoutRepository = checkoutRepository;
        this.participantRepository = participantRepository;
    }
    async execute(uid, repo, input) {
        const participantUid = await this.participantRepository.findById(uid);
        if (!participantUid) {
            throw new Error("Participant not found");
        }
        try {
            if (repo === "participant" || repo === "both") {
                const updateParticipantProps = {
                    ...participantUid.toDTO(),
                    name: input.name ?? participantUid.name,
                    email: input.email ?? participantUid.email,
                    phone: input.phone ?? participantUid.phone,
                    updatedAt: new Date(),
                };
                const updatedParticipant = new entities_1.Participant(updateParticipantProps);
                await this.participantRepository.update(updatedParticipant);
                if (repo === "participant") {
                    return { participant: updatedParticipant };
                }
            }
            if (repo === "checkout" || repo === "both") {
                const checkout = await this.checkoutRepository.findById(participantUid?.checkoutId);
                if (!checkout) {
                    throw new Error("Checkout not found");
                }
                const updateCheckoutProps = {
                    ...checkout.toDTO(),
                    status: input.status ?? checkout.status,
                    paymentMethod: input.paymentMethod ?? checkout.paymentMethod,
                    totalAmount: input.totalAmount ?? checkout.totalAmount,
                    updatedAt: new Date(),
                };
                const updatedCheckout = new entities_1.Checkout(updateCheckoutProps);
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
        }
        catch (error) {
            console.error(`Erro ao atualizar ${repo} com UID ${uid}:`, error);
            throw new Error(`Failed to update ${repo}`);
        }
    }
}
exports.UpdateParticipantUsecase = UpdateParticipantUsecase;
//# sourceMappingURL=UpdateParticipantUsecase.js.map