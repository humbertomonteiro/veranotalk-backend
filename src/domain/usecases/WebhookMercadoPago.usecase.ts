import { MercadoPagoConfig, Payment } from "mercadopago";
import {
  CheckoutRepository,
  ParticipantRepository,
} from "../interfaces/repositories";
import { CheckoutStatus, Checkout } from "../entities";
import { sendConfirmationEmail } from "../../utils/sendEmail.utils";
import logger from "../../utils/logger";
import crypto from "crypto";
import { config } from "dotenv";
config();

interface WebhookMercadoPagoInput {
  action: string;
  api_version: string;
  data: {
    id: string;
  };
  date_created: string;
  id: number;
  live_mode: boolean;
  type: string;
  user_id: string;
}

class WebhookMercadoPagoUseCase {
  constructor(
    private checkoutRepository: CheckoutRepository,
    private participantRepository: ParticipantRepository
  ) {}

  async execute(
    input: WebhookMercadoPagoInput,
    xSignature: any,
    xRequestId: any,
    dataIdUrl: any
  ): Promise<void> {
    const mercadoPagoId = input.data.id;
    this.validateXSignature(xSignature, dataIdUrl, xRequestId);
    try {
      logger.info("Processando webhook", {
        mercadoPagoId,
        action: input.action,
      });

      // Ignorar eventos não relevantes
      if (!["payment.created", "payment.updated"].includes(input.action)) {
        logger.info("Evento ignorado", { action: input.action, mercadoPagoId });
        return;
      }

      // Configurar cliente do Mercado Pago
      const client = new MercadoPagoConfig({
        accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || "",
      });
      const paymentClient = new Payment(client);

      // Consultar o status do pagamento
      const payment = await paymentClient.get({ id: Number(mercadoPagoId) });
      const status = payment.status; //
      const externalReference = payment.external_reference;
      const paymentMethodId = payment.payment_method_id;
      const payerFirstName = payment.payer?.first_name || "";
      const payerLastName =
        payment.card?.cardholder?.name || payment.payer?.last_name || "";
      const payerDocument =
        payment.card?.cardholder?.identification?.number ||
        payment.payer?.identification?.number ||
        "";
      const payerName =
        `${payerFirstName} ${payerLastName}`.trim() || "Desconhecido";

      // Mapear status do Mercado Pago para CheckoutStatus
      let checkoutStatus: CheckoutStatus;
      switch (status) {
        case "approved":
          checkoutStatus = "approved";
          break;
        case "pending":
        case "in_process":
          checkoutStatus = "pending";
          break;
        case "rejected":
        case "cancelled":
          checkoutStatus = "rejected";
          break;
        default:
          logger.error("Status desconhecido do Mercado Pago", {
            status,
            mercadoPagoId,
          });
          throw new Error(`Status desconhecido do Mercado Pago: ${status}`);
      }

      // Mapear payment_method_id para paymentMethod
      let paymentMethod: string;
      switch (paymentMethodId) {
        case "visa":
        case "master":
        case "amex":
        case "elo":
        case "debelo":
          paymentMethod = "credit_card";
          break;
        case "pix":
          paymentMethod = "pix";
          break;
        case "bolbradesco":
        case "bolsantander":
          paymentMethod = "boleto";
          break;
        default:
          paymentMethod = paymentMethodId || "unknown";
          logger.warn("Método de pagamento desconhecido", {
            paymentMethodId,
            mercadoPagoId,
          });
      }

      // Tentar encontrar o checkout
      let checkout: Checkout | null = null;
      let attempts = 3;
      while (attempts > 0) {
        if (!externalReference) {
          logger.error("External reference não encontrado", { mercadoPagoId });
          throw new Error("External reference not found!");
        }
        logger.info("External Reference obtido", {
          externalReference,
        });
        checkout = await this.checkoutRepository.findById(externalReference);

        if (checkout) {
          logger.info("Checkout encontrado", {
            checkoutId: checkout.id,
            mercadoPagoId,
            externalReference,
            paymentMethod,
            payerName,
            payerDocument,
          });

          // Atualizar mercadoPagoId, paymentMethod e payer se for payment.created
          if (input.action === "payment.created") {
            if (
              !checkout.mercadoPagoId ||
              checkout.mercadoPagoId !== mercadoPagoId
            ) {
              checkout.setMercadoPagoId(mercadoPagoId);
              logger.info("Checkout atualizado com mercadoPagoId", {
                checkoutId: checkout.id,
                mercadoPagoId,
              });
            }
            if (
              !checkout.paymentMethod ||
              checkout.paymentMethod !== paymentMethod
            ) {
              checkout.setPaymentMethod(paymentMethod);
              logger.info("Checkout atualizado com paymentMethod", {
                checkoutId: checkout.id,
                paymentMethod,
              });
            }
            if (!checkout.payer?.name || !checkout.payer?.document) {
              checkout.setPayer({ name: payerName, document: payerDocument });
              logger.info("Checkout atualizado com payer", {
                checkoutId: checkout.id,
                payerName,
                payerDocument,
              });
            }
          }

          // Atualizar status do checkout
          checkout.updateStatus(checkoutStatus);
          await this.checkoutRepository.update(checkout);
          logger.info("Checkout atualizado", {
            checkoutId: checkout.id,
            status: checkoutStatus,
            mercadoPagoId,
            paymentMethod,
            payerName,
            payerDocument,
          });

          // Enviar notificações para participantes se aprovado
          if (checkoutStatus === "approved") {
            if (!checkout.id) {
              logger.error("Checkout id não encontrado", { mercadoPagoId });
              throw new Error("Checkout id not found");
            }

            const participants =
              await this.participantRepository.findByCheckoutId(checkout.id);
            for (const participant of participants) {
              try {
                await sendConfirmationEmail(participant, checkout);
                logger.info("E-mail de confirmação enviado", {
                  email: participant.email,
                  checkoutId: checkout.id,
                });
              } catch (error) {
                logger.error("Falha ao enviar e-mail", {
                  email: participant.email,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Erro desconhecido",
                });
              }
            }
          }
          return;
        }

        logger.warn("Checkout não encontrado, retrying", {
          mercadoPagoId,
          externalReference,
          attempt: 4 - attempts,
        });
        attempts--;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      logger.error("Checkout não encontrado após 3 tentativas", {
        mercadoPagoId,
        externalReference,
      });
      throw new Error(
        `Checkout não encontrado para mercadoPagoId: ${mercadoPagoId}, externalReference: ${externalReference}`
      );
    } catch (error) {
      logger.error("Erro ao processar webhook", {
        mercadoPagoId,
        action: input.action,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
      throw error;
    }
  }

  private validateXSignature(xSignature: any, dataIdUrl: any, xRequestId: any) {
    const parts = xSignature.split(",");
    let ts: string | null = null;
    let v1: string | null = null;

    for (const part of parts) {
      const [key, value] = part.split("=").map((p: any) => p.trim());
      if (key === "ts") ts = value;
      if (key === "v1") v1 = value;
    }

    if (!ts || !v1) {
      throw new Error("Invalid x-signature header");
    }

    const idFormatted = /^[a-zA-Z0-9]+$/.test(dataIdUrl as string)
      ? (dataIdUrl as string).toLowerCase()
      : dataIdUrl;

    const manifest = `id:${idFormatted};request-id:${xRequestId};ts:${ts};`;

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    if (!secret) throw new Error("Secret not found");

    const generatedHash = crypto
      .createHmac("sha256", secret)
      .update(manifest)
      .digest("hex");

    if (generatedHash === v1) {
      logger.info("Webhook verificado com sucesso");
    } else {
      logger.error("Assinatura inválida");
      throw new Error("Assinatura inválida");
    }
  }
}

export { WebhookMercadoPagoUseCase, WebhookMercadoPagoInput };
