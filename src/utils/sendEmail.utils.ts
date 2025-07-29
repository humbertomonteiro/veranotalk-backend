import nodemailer from "nodemailer";
import { Participant, Checkout } from "../domain/entities";
import { config } from "dotenv";

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
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: participant.email,
      subject: `Confirmação de Pagamento - Evento ${
        checkout.metadata?.eventId || "Desconhecido"
      }`,
      text: `Olá ${participant.name},\n\nSeu pagamento foi aprovado!\n\nCheckout ID: ${checkout.id}\nEvento: ${checkout.metadata?.eventId}\n\nObrigado por sua compra!`,
      html: `<h1>Pagamento Aprovado</h1><p>Olá ${participant.name},</p><p>Seu pagamento foi aprovado com sucesso!</p><p><strong>Checkout ID:</strong> ${checkout.id}</p><p><strong>Evento:</strong> ${checkout.metadata?.eventId}</p><p>Obrigado por sua compra!</p>`,
    });
    console.log(`E-mail enviado para ${participant.email}`);
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${participant.email}:`, error);
    throw new Error(`Falha ao enviar e-mail: ${error}`);
  }
}
