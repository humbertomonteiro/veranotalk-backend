import { Request, Response } from "express";
import { CheckoutService } from "../services/Checkout.service";
import { FirebaseCheckoutRepository } from "../../repositories";
import {
  CreateCheckoutInput,
  WebhookMercadoPagoUseCase,
  WebhookMercadoPagoInput,
} from "../../../domain/usecases";
import { FirebaseParticipantRepository } from "../../repositories";

export class CheckoutController {
  private readonly checkoutRepository: FirebaseCheckoutRepository;
  private readonly webhookUseCase: WebhookMercadoPagoUseCase;

  constructor(
    private readonly checkoutService: CheckoutService,
    checkoutRepository: FirebaseCheckoutRepository,
    participantRepository: FirebaseParticipantRepository
  ) {
    this.checkoutRepository = checkoutRepository;
    this.webhookUseCase = new WebhookMercadoPagoUseCase(
      checkoutRepository,
      participantRepository
    );
  }

  async createCheckout(req: Request, res: Response): Promise<void> {
    try {
      const input: CreateCheckoutInput = req.body;

      // Validação básica
      if (!input.participants || !input.checkout) {
        res.status(400).json({
          error: "Dados de participantes e checkout são obrigatórios",
        });
        return;
      }

      const result = await this.checkoutService.createCheckout(input);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const input: WebhookMercadoPagoInput = req.body;
      await this.webhookUseCase.execute(input);
      res.status(200).send("OK");
    } catch (error) {
      console.error("Erro ao processar webhook:", error);
      res.status(500).json({
        error:
          error instanceof Error ? error.message : "Erro ao processar webhook",
      });
    }
  }
}
