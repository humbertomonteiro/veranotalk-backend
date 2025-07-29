import {
  CreateCheckoutUseCase,
  CreateCheckoutInput,
  CreateCheckoutOutput,
} from "../../../domain/usecases/CreateCheckout.usecase";

export class CheckoutService {
  constructor(private readonly createCheckoutUseCase: CreateCheckoutUseCase) {}

  async createCheckout(
    input: CreateCheckoutInput
  ): Promise<CreateCheckoutOutput> {
    return this.createCheckoutUseCase.execute(input);
  }
}
