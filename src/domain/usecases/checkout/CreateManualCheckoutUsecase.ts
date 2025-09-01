import {
  Checkout,
  CheckoutProps,
  CheckoutStatus,
  Participant,
  ParticipantProps,
} from "../../entities";
import {
  CheckoutRepository,
  ParticipantRepository,
} from "../../interfaces/repositories";
import { InternalServerError, ValidationError } from "../../../utils/errors";
import { sendConfirmationEmail } from "../../../utils/sendEmail.utils";
import logger from "../../../utils/logger";

interface CreateManualCheckoutInput {
  participants: ParticipantProps[];
  checkout: Omit<
    CheckoutProps,
    | "status"
    | "createdAt"
    | "updatedAt"
    | "mercadoPagoId"
    | "mercadoPagoPreferenceId"
  > & {
    paymentMethod: "pix" | "credit_card" | "boleto" | "debit_card";
    installments?: number;
  };
}

interface CreateManualCheckoutOutput {
  checkoutId: string;
  status: CheckoutStatus;
  dataCheckout: CheckoutProps;
  participantIds: string[];
}

export class CreateManualCheckoutUseCase {
  constructor(
    private checkoutRepository: CheckoutRepository,
    private participantRepository: ParticipantRepository
  ) {}

  async execute(
    input: CreateManualCheckoutInput
  ): Promise<CreateManualCheckoutOutput> {
    let checkout: Checkout | undefined;
    let checkoutId: string | undefined;

    try {
      if (!input.participants.length) {
        throw new ValidationError("Pelo menos um participante é obrigatório");
      }

      // Validar método de pagamento
      if (!input.checkout.paymentMethod) {
        throw new ValidationError("Método de pagamento é obrigatório");
      }

      // Validar parcelas para cartão de crédito
      if (
        input.checkout.paymentMethod === "credit_card" &&
        (!input.checkout.installments || input.checkout.installments < 1)
      ) {
        throw new ValidationError(
          "Número de parcelas é obrigatório para cartão de crédito"
        );
      }

      // Calcular o valor total
      const totalAmount = this.calculateTotalAmount(
        input.checkout.fullTickets,
        input.checkout.halfTickets || 0
      );

      // Criar checkout manual (já aprovado)
      const checkoutProps: CheckoutProps = {
        ...input.checkout,
        status: "approved" as CheckoutStatus,
        totalAmount,
        paymentMethod: input.checkout.paymentMethod,
        metadata: {
          participantIds: [],
          eventId: input.checkout.metadata?.eventId || "verano-talk-2025",
          manualPayment: true,
          ...input.checkout.metadata,
        },
      };

      checkout = new Checkout(checkoutProps);
      checkoutId = await this.checkoutRepository.save(checkout);
      logger.info(`Checkout manual salvo com ID: ${checkoutId}`);

      // Atualizar checkout com ID
      checkout = new Checkout({ ...checkoutProps, id: checkoutId });

      // Criar e salvar participantes com checkoutId
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

      // Atualizar checkout com participantIds
      checkout.addParticipants(participantIds);
      await this.checkoutRepository.update(checkout);
      logger.info(
        `Checkout manual atualizado com participantes: ${checkoutId}`
      );

      // ENVIO DE EMAILS DE CONFIRMAÇÃO - NOVA PARTE
      await this.sendConfirmationEmails(checkout, participants);

      return {
        checkoutId,
        status: checkout.status,
        dataCheckout: checkout.toDTO(),
        participantIds,
      };
    } catch (error) {
      logger.error("Erro no CreateManualCheckoutUseCase:", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        checkoutId,
      });

      if (checkout && checkoutId) {
        // Em caso de erro, marcar como failed mesmo sendo manual
        checkout.updateStatus("failed");
        await this.checkoutRepository.update(checkout);
        logger.warn(`Checkout manual atualizado para failed: ${checkoutId}`);
      }
      throw error instanceof Error
        ? error
        : new InternalServerError("Falha ao criar checkout manual");
    }
  }

  private async sendConfirmationEmails(
    checkout: Checkout,
    participants: Participant[]
  ): Promise<void> {
    try {
      logger.info("Iniciando envio de emails de confirmação", {
        checkoutId: checkout.id,
        totalParticipants: participants.length,
      });

      const emailPromises = participants.map(async (participant) => {
        try {
          await sendConfirmationEmail(participant, checkout);
          logger.info("E-mail de confirmação enviado com sucesso", {
            email: participant.email,
            participantId: participant.id,
            checkoutId: checkout.id,
          });
          return { success: true, email: participant.email };
        } catch (emailError) {
          logger.error("Falha ao enviar e-mail de confirmação", {
            email: participant.email,
            error:
              emailError instanceof Error
                ? emailError.message
                : "Erro desconhecido",
            checkoutId: checkout.id,
          });
          return {
            success: false,
            email: participant.email,
            error: emailError,
          };
        }
      });

      const results = await Promise.allSettled(emailPromises);

      // Log dos resultados
      const successfulEmails = results.filter(
        (result) => result.status === "fulfilled" && result.value.success
      ).length;

      const failedEmails = results.length - successfulEmails;

      logger.info("Resumo do envio de emails", {
        checkoutId: checkout.id,
        total: participants.length,
        successful: successfulEmails,
        failed: failedEmails,
      });

      if (failedEmails > 0) {
        logger.warn("Alguns emails falharam no envio", {
          checkoutId: checkout.id,
          failedCount: failedEmails,
        });
        // Não lançamos erro aqui porque o checkout já foi criado com sucesso
        // Os emails falhados podem ser reenviados manualmente ou tratados separadamente
      }
    } catch (error) {
      logger.error("Erro inesperado no processo de envio de emails", {
        error: error instanceof Error ? error.message : "Erro desconhecido",
        checkoutId: checkout.id,
      });
      // Não lançamos o erro para não falhar o checkout completo
      // O checkout foi criado com sucesso, apenas o email falhou
    }
  }

  private calculateTotalAmount(fullTickets: number, halfTickets: number) {
    const valueTicketAll = Number(process.env.BASE_TICKET_PRICE) || 499;
    const valueTicketHalf = Number(process.env.HALF_TICKET_PRICE) || 249.5;
    return fullTickets * valueTicketAll + halfTickets * valueTicketHalf;
  }
}

export { CreateManualCheckoutInput, CreateManualCheckoutOutput };
