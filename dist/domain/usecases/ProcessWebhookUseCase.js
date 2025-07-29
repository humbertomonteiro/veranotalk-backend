"use strict";
// import { CheckoutRepository } from "../interfaces/CheckoutRepository.interface";
// import { ParticipantRepository } from "../interfaces/ParticipantRepository.interface";
// import {
//   MercadoPagoRepository,
//   MercadoPagoWebhookInput,
// } from "../interfaces/MercadoPagoRepository.interface";
// import { Checkout } from "../entities/Checkout";
// export interface ProcessWebhookUseCase {
//   execute(input: MercadoPagoWebhookInput): Promise<void>;
// }
// export class ProcessWebhookUseCaseImpl implements ProcessWebhookUseCase {
//   constructor(
//     private readonly checkoutRepository: CheckoutRepository,
//     private readonly participantRepository: ParticipantRepository,
//     private readonly mercadoPagoRepository: MercadoPagoRepository
//   ) {}
//   async execute(input: MercadoPagoWebhookInput): Promise<void> {
//     // Processa o webhook usando o MercadoPagoRepository
//     await this.mercadoPagoRepository.processWebhook(input);
//     // Consulta o pagamento para obter o external_reference e status
//     const paymentResponse = await this.mercadoPagoRepository.getPayment(
//       input.data.id
//     );
//     const checkoutId = paymentResponse.externalReference;
//     const paymentStatus = paymentResponse.status;
//     if (!checkoutId) {
//       throw new Error("Checkout ID not found in payment response");
//     }
//     // Busca o checkout no Firebase
//     const checkout = await this.checkoutRepository.findById(checkoutId);
//     if (!checkout) {
//       throw new Error(`Checkout not found for ID: ${checkoutId}`);
//     }
//     // Mapeia o status do Mercado Pago para o CheckoutStatus
//     const statusMap: Record<string, Checkout["status"]> = {
//       approved: "approved",
//       pending: "pending",
//       rejected: "rejected",
//       cancelled: "cancelled",
//       refunded: "refunded",
//     };
//     const newStatus = statusMap[paymentStatus] || "pending";
//     // Atualiza o status do checkout e o mercadoPagoId
//     if (newStatus === "approved") {
//       checkout.approve(paymentResponse.id);
//     } else {
//       checkout.updateStatus(newStatus);
//     }
//     // Se o pagamento for aprovado, gera QR Codes para os participantes
//     if (newStatus === "approved") {
//       const participants = await this.participantRepository.findByCheckoutId(
//         checkoutId
//       );
//       for (const participant of participants) {
//         participant.generateQrCode();
//         await this.participantRepository.update(participant);
//       }
//     }
//     // Atualiza o checkout no Firebase
//     await this.checkoutRepository.update(checkout);
//   }
// }
//# sourceMappingURL=ProcessWebhookUseCase.js.map