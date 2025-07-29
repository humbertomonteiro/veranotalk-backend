"use strict";
// import { Request, Response } from "express";
// import {
//   ProcessWebhookUseCase,
//   //   ProcessWebhookUseCaseImpl,
// } from "../../../domain/usecases/ProcessWebhookUseCase";
// // Schema de validação com Zod
// // const webhookSchema = z.object({
// //   action: z.string().min(1, "Action is required"),
// //   data: z.object({
// //     id: z.string().min(1, "Payment ID is required"),
// //   }),
// // });
// export class WebhookController {
//   constructor(private readonly processWebhookUseCase: ProcessWebhookUseCase) {}
//   async processWebhook(req: Request, res: Response): Promise<void> {
//     try {
//       // Valida os dados de entrada
//       //   const input = webhookSchema.parse(req.body) as MercadoPagoWebhookInput;
//       const input = req.body;
//       // Executa o caso de uso
//       await this.processWebhookUseCase.execute(input);
//       // Retorna 200 para confirmar o recebimento (exigência do Mercado Pago)
//       res.status(200).send("Webhook processed successfully");
//     } catch (error) {
//       console.log(error);
//       //   if (error instanceof z.ZodError) {
//       //     console.error("Webhook validation error:", error.errors);
//       //     res.status(400).send("Invalid webhook payload");
//       //   } else {
//       //     console.error("Webhook processing error:", error instanceof Error ? error.message : "Unknown error");
//       //     res.status(500).send("Failed to process webhook");
//       //   }
//     }
//   }
// }
//# sourceMappingURL=Webhook.controller.js.map