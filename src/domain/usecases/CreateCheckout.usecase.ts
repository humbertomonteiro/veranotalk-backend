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
import { InternalServerError, ValidationError } from "../../utils/errors";
import { config } from "dotenv";
config();

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
  dataCheckout: CheckoutProps;
}

export class CreateCheckoutUseCase {
  constructor(
    private checkoutRepository: CheckoutRepository,
    private participantRepository: ParticipantRepository
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    let checkout: Checkout | undefined;
    let checkoutId: string | undefined;

    try {
      if (!input.participants.length) {
        throw new ValidationError("Pelo menos um participante é obrigatório");
      }

      // Criar checkout primeiro
      const checkoutProps: CheckoutProps = {
        ...input.checkout,
        status: "pending",
        metadata: {
          participantIds: [],
          eventId: input.checkout.metadata?.eventId || "verano-talk",
        },
      };
      checkout = new Checkout(checkoutProps);
      checkoutId = await this.checkoutRepository.save(checkout);
      console.log(`Checkout salvo com ID: ${checkoutId}`);

      // Atualizar checkout com ID
      checkout = new Checkout({ ...checkoutProps, id: checkoutId });

      // Criar e salvar participantes com checkoutId
      const participants = input.participants.map(
        (props) =>
          new Participant({
            ...props,
            eventId: props.eventId || "verano-talk",
            checkoutId: checkoutId || "",
          })
      );
      const participantIds: string[] = [];

      for (const participant of participants) {
        participant.generateQrCode();
        const participantId = await this.participantRepository.save(
          participant
        );
        participantIds.push(participantId);
      }

      // Atualizar checkout com participantIds
      checkout.addParticipants(participantIds);
      checkout.setTotalAmount(
        this.calculateTotalAmount(
          input.checkout.fullTickets,
          input.checkout.halfTickets
        )
      );
      checkout.startProcessing();
      await this.checkoutRepository.update(checkout);
      console.log(`Checkout atualizado para processing: ${checkoutId}`);

      // Criar preferência de pagamento no Mercado Pago
      const preference = {
        items: [
          {
            id: `item-${checkoutId}`,
            title: `Ingressos para evento ${
              input.checkout.metadata?.eventId || "Verano Talk"
            }`,
            unit_price: checkout.totalAmount!,
            quantity: 1,
          },
        ],
        payer: {
          email: participants[0]?.email || "no-reply@veranotalk.com",
        },
        external_reference: checkoutId,
        back_urls: {
          success: "https://veranotalk.com.br/success",
        },
        auto_return: "approved" as "approved",
      };

      const preferenceResponse = await preferenceClient.create({
        body: preference,
      });

      if (!preferenceResponse.init_point || !preferenceResponse.id) {
        console.error("Resposta do Mercado Pago inválida:", preferenceResponse);
        checkout.fail(
          new InternalServerError(
            "Resposta do Mercado Pago inválida: init_point ou id ausente"
          )
        );
        await this.checkoutRepository.update(checkout);
        throw new InternalServerError(
          "Resposta do Mercado Pago inválida: init_point ou id ausente"
        );
      }

      // Atualizar checkout com Mercado Pago ID
      checkout.setMercadoPagoPreferenceId(preferenceResponse.id);
      await this.checkoutRepository.update(checkout);
      console.log(
        `Checkout atualizado com mercadoPagoPreferenceId: ${preferenceResponse.id}`
      );

      return {
        checkoutId,
        paymentUrl: preferenceResponse.init_point,
        status: checkout.status,
        dataCheckout: checkout.toDTO(),
      };
    } catch (error) {
      console.error("Erro no CreateCheckoutUseCase:", error);
      if (checkout && checkoutId) {
        checkout.fail(
          error instanceof Error
            ? error
            : new InternalServerError("Erro desconhecido")
        );
        await this.checkoutRepository.update(checkout);
        console.log(`Checkout atualizado para failed: ${checkoutId}`);
      }
      throw error instanceof Error
        ? error
        : new InternalServerError("Falha ao criar checkout");
    }
  }

  private calculateTotalAmount(fullTickets: number, halfTickets: number) {
    const valueTicketAll = process.env.BASE_TICKET_PRICE;
    const valueTicketHalf = process.env.HALF_TICKET_PRICE;

    const totalAmount =
      fullTickets * Number(valueTicketAll) +
      halfTickets * Number(valueTicketHalf);

    return totalAmount;
  }
}

export { CreateCheckoutInput, CreateCheckoutOutput };
