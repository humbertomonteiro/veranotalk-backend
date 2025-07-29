import {
  CreateCheckoutUseCase,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  WebhookMercadoPagoUseCase,
  WebhookMercadoPagoInput,
} from "../../../domain/usecases";
import { FirebaseCheckoutRepository } from "../../repositories";
import { Checkout } from "../../../domain/entities";

export class CheckoutService {
  constructor(
    private readonly createCheckoutUseCase: CreateCheckoutUseCase,
    private readonly webhookUseCase: WebhookMercadoPagoUseCase,
    private readonly checkoutRepository: FirebaseCheckoutRepository
  ) {}

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutOutput> {
    return this.createCheckoutUseCase.execute(input);
  }

  async handleWebhook(input: WebhookMercadoPagoInput): Promise<void> {
    await this.webhookUseCase.execute(input);
  }

  async getCheckoutById(checkoutId: string): Promise<Checkout | null> {
    const checkout = await this.checkoutRepository.findById(checkoutId);
    if (!checkout) {
      throw new Error("Checkout não encontrado");
    }
    return checkout;
  }
}
