import { MercadoPagoConfig, Preference } from "mercadopago";
import {
  Checkout,
  CheckoutProps,
  CheckoutStatus,
  Participant,
  ParticipantProps,
} from "../entities";
import {
  CheckoutRepository,
  ParticipantRepository,
} from "../interfaces/repositories";
import { config } from "dotenv";
import { success } from "zod";
config();

// Configuração do cliente do Mercado Pago
const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "SUA_CHAVE_AQUI",
});
const preferenceClient = new Preference(mercadoPagoClient);

interface CreateCheckoutInput {
  participants: ParticipantProps[];
  checkout: Omit<
    CheckoutProps,
    "status" | "createdAt" | "updatedAt" | "mercadoPagoId" | "paymentMethod"
  >;
}

interface CreateCheckoutOutput {
  checkoutId: string;
  paymentUrl: string;
  status: CheckoutStatus;
  dataCheckout: Checkout;
}

class CreateCheckoutUseCase {
  constructor(
    private checkoutRepository: CheckoutRepository,
    private participantRepository: ParticipantRepository
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    let checkout: Checkout | undefined;
    let checkoutId: string | undefined;

    try {
      // 1. Criar e validar participantes
      const participants = input.participants.map(
        (props) => new Participant(props)
      );
      const participantIds: string[] = [];

      // 2. Salvar participantes
      for (const participant of participants) {
        const participantId = await this.participantRepository.save(
          participant
        );
        participantIds.push(participantId);
      }

      // 3. Criar checkout
      const checkoutProps: CheckoutProps = {
        ...input.checkout,
        status: "pending",
        metadata: {
          participantIds,
          eventId: input.checkout.metadata?.eventId,
        },
      };
      checkout = new Checkout(checkoutProps);

      // 4. Salvar checkout
      checkoutId = await this.checkoutRepository.save(checkout);
      console.log(`Checkout salvo com ID: ${checkoutId}`);

      // Atualizar o checkout com o ID gerado
      checkout = new Checkout({ ...checkoutProps, id: checkoutId });

      // 5. Iniciar processamento
      checkout.startProcessing();
      await this.checkoutRepository.update(checkout);
      console.log(`Checkout atualizado para processing: ${checkoutId}`);

      // 6. Criar preferência de pagamento no Mercado Pago
      const preference = {
        items: [
          {
            id: `item-${checkoutId}`,
            title: `Ingressos para evento ${
              input.checkout.metadata?.eventId || "desconhecido"
            }`,
            unit_price: checkout.totalAmount,
            quantity: 1,
          },
        ],
        payer: {
          email: participants[0]?.email || "no-reply@veranotalk.com",
        },
        external_reference: checkoutId,
        back_urls: {
          success: "https://veranotalk.com.br/success",
          //   failure: "https://sua-landing-page.com/failure",
          //   pending: "https://sua-landing-page.com/pending",
        },
        auto_return: "approved" as "approved",
      };

      const preferenceResponse = await preferenceClient.create({
        body: preference,
      });

      // Verificar se init_point e id estão presentes
      if (!preferenceResponse.init_point || !preferenceResponse.id) {
        console.error("Resposta do Mercado Pago inválida:", preferenceResponse);
        checkout.fail(
          new Error(
            "Resposta do Mercado Pago inválida: init_point ou id ausente"
          )
        );
        await this.checkoutRepository.update(checkout);
        throw new Error(
          "Resposta do Mercado Pago inválida: init_point ou id ausente"
        );
      }

      // 7. Atualizar checkout com Mercado Pago ID
      checkout.setMercadoPagoId(preferenceResponse.id);
      await this.checkoutRepository.update(checkout);
      console.log(
        `Checkout atualizado com mercadoPagoId: ${preferenceResponse.id}`
      );

      return {
        checkoutId,
        paymentUrl: preferenceResponse.init_point,
        status: checkout.status,
        dataCheckout: checkout,
      };
    } catch (error) {
      console.error("Erro no CreateCheckoutUseCase:", error);
      if (checkout && checkoutId) {
        // Atualizar o checkout existente com status failed
        checkout.fail(
          new Error(
            error instanceof Error ? error.message : "Erro desconhecido"
          )
        );
        await this.checkoutRepository.update(checkout);
        console.log(`Checkout atualizado para failed: ${checkoutId}`);
      }
      throw new Error(`Falha ao criar checkout: ${error}`);
    }
  }
}

export { CreateCheckoutUseCase, CreateCheckoutInput, CreateCheckoutOutput };
