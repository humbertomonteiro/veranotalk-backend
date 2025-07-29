import express, { Request, Response } from "express";
import { CheckoutController } from "./infrastructure/http/controllers/Checkout.controller";
import { CheckoutService } from "./infrastructure/http/services/Checkout.service";
import { ParticipantController } from "./infrastructure/http/controllers/Participant.controller";
import { ParticipantService } from "./infrastructure/http/services/Participant.service";
import {
  CreateCheckoutUseCase,
  WebhookMercadoPagoUseCase,
} from "./domain/usecases";
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
const participantService = new ParticipantService(participantRepository);
const participantController = new ParticipantController(participantService);

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
