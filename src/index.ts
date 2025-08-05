import express, { Request, Response } from "express";
import { CheckoutController } from "./infrastructure/http/controllers/Checkout.controller";
import { CheckoutService } from "./infrastructure/http/services/Checkout.service";
import { ParticipantController } from "./infrastructure/http/controllers/Participant.controller";
import { ParticipantService } from "./infrastructure/http/services/Participant.service";
import {
  CreateCheckoutUseCase,
  WebhookMercadoPagoUseCase,
} from "./domain/usecases";

import { MercadoPagoProva } from "../prova/MercadoPagoProva";
import { SimpleMercadoPagoWebhook } from "../prova/WebhookProva";

import { FirebaseCheckoutRepository } from "./infrastructure/repositories";
import { FirebaseParticipantRepository } from "./infrastructure/repositories";
import cors from "cors";
import { config } from "dotenv";
config();

const app = express();

app.use(cors());
app.use(express.json());

// Configurar dependências
const checkoutRepository = new FirebaseCheckoutRepository();
const participantRepository = new FirebaseParticipantRepository();
const createCheckoutUseCase = new CreateCheckoutUseCase(
  checkoutRepository,
  participantRepository
);
const webhookUseCase = new WebhookMercadoPagoUseCase(
  checkoutRepository,
  participantRepository
);
const checkoutService = new CheckoutService(
  createCheckoutUseCase,
  webhookUseCase,
  checkoutRepository
);
const checkoutController = new CheckoutController(checkoutService);
const participantService = new ParticipantService(
  participantRepository,
  checkoutRepository
);
const participantController = new ParticipantController(participantService);

const mercadoPagoProvaPreference = new MercadoPagoProva();

app.post("/prova", async (req: Request, res: Response) => {
  const input = req.body;
  try {
    const response = await mercadoPagoProvaPreference.execute(input);
    res.status(200).json(response);
  } catch (error) {
    res.json(error);
  }
});

app.post("/webhook", async (req, res) => {
  try {
    const webhook = new SimpleMercadoPagoWebhook();
    const result = await webhook.execute(
      req.body,
      req.headers["x-signature"] as string,
      req.headers["x-request-id"] as string,
      req.body.id
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(400).json({ error: "Falha no processamento" });
  }
});

// Rotas
app.post("/checkout", (req: Request, res: Response) =>
  checkoutController.createCheckout(req, res)
);
app.post("/webhook/mercadopago", (req: Request, res: Response) =>
  checkoutController.handleWebhook(req, res)
);
app.get("/checkout/:id", (req: Request, res: Response) =>
  checkoutController.getCheckoutById(req, res)
);
app.get("/participant/:document", (req: Request, res: Response) =>
  participantController.getParticipantByDocument(req, res)
);
app.post("/participant/validate-qr", (req: Request, res: Response) =>
  participantController.validateQRCode(req, res)
);
app.get(
  "/participant/:participantId/certificate",
  (req: Request, res: Response) =>
    participantController.getCertificate(req, res)
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
