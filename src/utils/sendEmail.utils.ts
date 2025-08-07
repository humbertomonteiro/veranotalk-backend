import nodemailer from "nodemailer";
import { Participant, Checkout } from "../domain/entities";
import { config } from "dotenv";
import logger from "./logger";

config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendConfirmationEmail(
  participant: Participant,
  checkout: Checkout
): Promise<void> {
  const eventName = checkout.metadata?.eventId || "Desconhecido";
  const participantAreaUrl = "https://www.veranotalk.com.br/area-participant";

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmação de Pagamento - VeranoTalk</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Raleway', Arial, sans-serif; background-color: #000000;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);">
        <!-- Cabeçalho -->
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #000000; color: #ffffff; border-top-left-radius: 8px; border-top-right-radius: 8px;">
            <h1 style="margin: 0; font-family: 'Italiana', 'Times New Roman', serif; font-size: 32px; letter-spacing: 2px; text-transform: uppercase;">VERANO TALK</h1>
            <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9; letter-spacing: 1px;">Confirmação de Pagamento</p>
          </td>
        </tr>
        <!-- Corpo -->
        <tr>
          <td style="padding: 30px;">
            <p style="font-size: 16px; color: #333333; margin: 0 0 15px;">Olá, <strong>${participant.name}</strong>,</p>
            <p style="font-size: 16px; color: #333333; margin: 0 0 15px;">Seu pagamento para o evento <strong style="color: #ddd3c3; position: relative; text-decoration: none; border-bottom: 2px solid #ddd3c3;">${eventName}</strong> foi aprovado com sucesso!</p>
            <p style="font-size: 16px; color: #333333; margin: 0 0 15px;"><strong>Checkout ID:</strong> ${checkout.id}</p>
            <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Acesse a <strong>Área do Participante</strong> para visualizar seu ingresso, receber atualizações do evento, informações importantes e gerenciar sua participação.</p>
            <!-- Botão -->
            <table role="presentation" cellspacing="0" cellpadding="0" style="margin: 20px auto;">
              <tr>
                <td style="text-align: center;">
                  <a href="${participantAreaUrl}" style="display: inline-block; padding: 12px 24px; background-color: #ddd3c3; color: #000000; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px; border: 1px solid rgba(102, 75, 49, 0.3); font-family: 'Raleway', Arial, sans-serif;">Acessar Área do Participante</a>
                </td>
              </tr>
            </table>
            <p style="font-size: 14px; color: #666666; margin: 20px 0 0;">Dúvidas? Entre em contato com nossa equipe pelo e-mail <a href="mailto:suporteveranotalk@gmail.com" style="color: #ddd3c3; text-decoration: none;">suporte@veranotalk.com.br</a>.</p>
          </td>
        </tr>
        <!-- Detalhes do Evento -->
        <tr>
          <td style="padding: 20px; text-align: center; background-color: rgba(102, 75, 49, 0.1);">
            <p style="font-size: 14px; color: #333333; margin: 0;">São Luís - Maranhão</p>
            <p style="font-size: 14px; color: #333333; margin: 5px 0 0;">16/10/2025 - Das 09h às 21h</p>
          </td>
        </tr>
        <!-- Rodapé -->
        <tr>
          <td style="padding: 20px; text-align: center; background-color: #000000; color: #ffffff; border-bottom-left-radius: 8px; border-bottom-right-radius: 8px;">
            <p style="font-size: 12px; margin: 0; opacity: 0.9;">© 2025 VeranoTalk. Todos os direitos reservados.</p>
            <p style="font-size: 12px; margin: 5px 0 0;">
              <a href="https://www.veranotalk.com.br" style="color: #ddd3c3; text-decoration: none;">www.veranotalk.com.br</a>
            </p>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const textContent = `
Olá ${participant.name},

Seu pagamento para o evento ${eventName} foi aprovado!

Checkout ID: ${checkout.id}
Evento: São Luís - Maranhão, 16/10/2025 - Das 09h às 20h

Acesse a Área do Participante para visualizar seu ingresso, atualizações do evento e informações importantes: ${participantAreaUrl}

Dúvidas? Entre em contato: veranotalk@gmail.com

© 2025 VeranoTalk. Todos os direitos reservados.
`;

  try {
    await transporter.sendMail({
      from: `"VeranoTalk" <${process.env.EMAIL_USER}>`,
      to: participant.email,
      subject: `Confirmação de Pagamento - ${eventName} - VeranoTalk`,
      text: textContent,
      html: htmlContent,
    });
    logger.info(`E-mail enviado para ${participant.email}`, {
      checkoutId: checkout.id,
      eventName,
    });
  } catch (error) {
    logger.error(`Erro ao enviar e-mail para ${participant.email}`, {
      error: error instanceof Error ? error.message : "Erro desconhecido",
      checkoutId: checkout.id,
      eventName,
    });
    throw new Error(`Falha ao enviar e-mail: ${error}`);
  }
}
