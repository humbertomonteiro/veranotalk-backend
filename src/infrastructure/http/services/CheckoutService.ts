import {
  CreateCheckoutUseCase,
  CreateCheckoutInput,
  CreateCheckoutOutput,
  WebhookMercadoPagoUseCase,
  WebhookMercadoPagoInput,
  CreateManualCheckoutInput,
  CreateManualCheckoutOutput,
  CreateManualCheckoutUseCase,
  DeleteCheckoutInput,
  DeleteCheckoutOutput,
  DeleteCheckoutUseCase,
} from "../../../domain/usecases";
import { FirebaseCheckoutRepository } from "../../repositories";
import { Checkout } from "../../../domain/entities";

export class CheckoutService {
  constructor(
    private readonly createCheckoutUseCase: CreateCheckoutUseCase,
    private readonly createManualCheckoutUseCase: CreateManualCheckoutUseCase,
    private readonly webhookUseCase: WebhookMercadoPagoUseCase,
    private readonly checkoutRepository: FirebaseCheckoutRepository,
    private readonly deleteCheckoutUseCase: DeleteCheckoutUseCase
  ) {}

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutOutput> {
    return this.createCheckoutUseCase.execute(input);
  }

  async createManualCheckout(
    input: CreateManualCheckoutInput
  ): Promise<CreateManualCheckoutOutput> {
    return this.createManualCheckoutUseCase.execute(input);
  }

  async handleWebhook(
    input: WebhookMercadoPagoInput,
    xSignature: any,
    xRequestId: any,
    dataIdUrl: any
  ): Promise<void> {
    if (!xSignature || !xRequestId || !dataIdUrl) {
      throw new Error("Missing headers or query params");
    }

    await this.webhookUseCase.execute(input, xSignature, xRequestId, dataIdUrl);
  }

  async getCheckoutById(checkoutId: string): Promise<Checkout | null> {
    const checkout = await this.checkoutRepository.findById(checkoutId);
    if (!checkout) {
      throw new Error("Checkout não encontrado");
    }
    return checkout;
  }

  async deleteCheckout(checkoutId: string): Promise<DeleteCheckoutOutput> {
    try {
      const input: DeleteCheckoutInput = { checkoutId };
      return await this.deleteCheckoutUseCase.execute(input);
    } catch (error) {
      console.error(`Erro ao excluir checkout ${checkoutId}:`, error);
      throw error;
    }
  }
}
