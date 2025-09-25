import { MercadoPagoConfig, Preference } from "mercadopago";
import {
  Checkout,
  CheckoutProps,
  CheckoutStatus,
  Participant,
  ParticipantProps,
  Coupon,
} from "../../entities";
import {
  CheckoutRepository,
  ParticipantRepository,
  CouponRepository,
} from "../../interfaces/repositories";
import { InternalServerError, ValidationError } from "../../../utils/errors";
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

      // Calculate total amount before discount
      const originalAmount = this.calculateTotalAmount(
        input.checkout.fullTickets,
        input.checkout.halfTickets
      );

      // Validate and apply coupon, if provided
      let totalAmount = originalAmount;
      let discountAmount = 0;
      let coupon: Coupon | null = null;
      if (input.checkout.couponCode) {
        // Prohibit coupons for more than 1 ticket
        if (input.checkout.fullTickets > 1) {
          throw new ValidationError(
            "Cupons são permitidos apenas para 1 ingresso"
          );
        }
        coupon = await this.couponRepository.findByCode(
          input.checkout.couponCode
        );
        if (!coupon) {
          throw new ValidationError("Cupom inválido");
        }
        coupon.isValid(input.checkout.metadata?.eventId);
        // Calculate discount to match frontend logic
        if (coupon.discountType === "fixed") {
          discountAmount = coupon.discountValue;
        } else if (coupon.discountType === "percentage") {
          discountAmount = originalAmount * (coupon.discountValue / 100);
        }
        totalAmount = Math.max(0, originalAmount - discountAmount);
      }

      // Create checkout with coupon information
      const checkoutProps: CheckoutProps = {
        ...input.checkout,
        status: "pending",
        totalAmount,
        originalAmount,
        discountAmount,
        couponCode: coupon?.code || null,
        metadata: {
          participantIds: [],
          eventId: input.checkout.metadata?.eventId || "verano-talk-2025",
          ticketType: input.checkout.metadata?.ticketType || "all",
        },
      };
      checkout = new Checkout(checkoutProps);
      checkoutId = await this.checkoutRepository.save(checkout);
      console.log(`Checkout salvo com ID: ${checkoutId}`);

      // Update checkout with ID
      checkout = new Checkout({ ...checkoutProps, id: checkoutId });

      // Create and save participants with checkoutId
      const participants = input.participants.map(
        (props) =>
          new Participant({
            ...props,
            eventId: props.eventId || "verano-talk-2025",
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

      // Update checkout with participantIds
      checkout.addParticipants(participantIds);
      checkout.startProcessing();
      await this.checkoutRepository.update(checkout);
      console.log(`Checkout atualizado para processing: ${checkoutId}`);

      // Create payment preference in Mercado Pago
      const preference = {
        items: [
          {
            id: `item-${checkoutId}`,
            title: `${input.checkout.fullTickets} Ingressos para evento ${
              input.checkout.metadata?.eventId || "Verano Talk"
            }`,
            unit_price: checkout.totalAmount!,
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

      // Update checkout with Mercado Pago ID
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

  private calculateTotalAmount(
    fullTickets: number,
    halfTickets: number
    // ticketType?: string
  ) {
    let basePrice: number;
    if (fullTickets >= 5) {
      basePrice = 355;
    } else if (fullTickets >= 2) {
      basePrice = 399;
    } else {
      basePrice = fullTickets >= 5 ? 355 : fullTickets >= 2 ? 399 : 499;
    }
    const valueTicketHalf = Number(process.env.HALF_TICKET_PRICE) || 249.5;
    return fullTickets * basePrice + halfTickets * valueTicketHalf;
  }
}

export { CreateCheckoutInput, CreateCheckoutOutput };
