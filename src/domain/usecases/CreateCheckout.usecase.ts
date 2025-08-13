import { MercadoPagoConfig, Preference } from "mercadopago";
import {
  Checkout,
  CheckoutProps,
  CheckoutStatus,
  Participant,
  ParticipantProps,
  Coupon,
} from "../entities";
import {
  CheckoutRepository,
  ParticipantRepository,
  CouponRepository,
} from "../interfaces/repositories";
import { InternalServerError, ValidationError } from "../../utils/errors";
import { config } from "dotenv";
config();

const production = true;
const accessToken = production
  ? process.env.MERCADO_PAGO_ACCESS_TOKEN_PRODUCTION || "SUA_CHAVE_AQUI"
  : process.env.MERCADO_PAGO_ACCESS_TOKEN_SANDBOX || "SUA_CHAVE_AQUI";

const mercadoPagoClient = new MercadoPagoConfig({
  accessToken: accessToken,
  options: {
    integratorId: "dev_c6a5b0e1720711f08601a2fe03ffde10",
  },
});
const preferenceClient = new Preference(mercadoPagoClient);

interface CreateCheckoutInput {
  participants: ParticipantProps[];
  checkout: Omit<
    CheckoutProps,
    "status" | "createdAt" | "updatedAt" | "mercadoPagoId" | "paymentMethod"
  > & { couponCode?: string };
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
    private participantRepository: ParticipantRepository,
    private couponRepository: CouponRepository
  ) {}

  async execute(input: CreateCheckoutInput): Promise<CreateCheckoutOutput> {
    let checkout: Checkout | undefined;
    let checkoutId: string | undefined;

    try {
      if (!input.participants.length) {
        throw new ValidationError("Pelo menos um participante é obrigatório");
      }

      // Calcular o valor total antes do desconto
      const originalAmount = this.calculateTotalAmount(
        input.checkout.fullTickets,
        input.checkout.halfTickets
      );

      // Validar e aplicar cupom, se fornecido
      let totalAmount = originalAmount;
      let discountAmount = 0;
      let coupon: Coupon | null = null;
      if (input.checkout.couponCode) {
        coupon = await this.couponRepository.findByCode(
          input.checkout.couponCode
        );
        if (!coupon) {
          throw new ValidationError("Cupom inválido");
        }
        coupon.isValid(input.checkout.metadata?.eventId); // Valida expiração, usos e evento
        totalAmount = coupon.apply(originalAmount);
        discountAmount = originalAmount - totalAmount;
        coupon.incrementUses(); // Incrementa usos
        await this.couponRepository.update(coupon); // Atualiza no Firestore
      }

      // Criar checkout com informações do cupom
      const checkoutProps: CheckoutProps = {
        ...input.checkout,
        status: "pending",
        totalAmount,
        originalAmount,
        discountAmount,
        couponCode: coupon?.code || null,
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
            unit_price: checkout.totalAmount!, // Usa valor com desconto
            quantity: 1,
          },
        ],
        payer: {
          email: participants[0]?.email || "no-reply@veranotalk.com",
        },
        payment_methods: {
          installments: 12,
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
    const valueTicketAll = Number(process.env.BASE_TICKET_PRICE) || 499;
    const valueTicketHalf = Number(process.env.HALF_TICKET_PRICE) || 249.5;
    return fullTickets * valueTicketAll + halfTickets * valueTicketHalf;
  }
}

export { CreateCheckoutInput, CreateCheckoutOutput };
