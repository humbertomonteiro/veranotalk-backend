import express, { Request, Response } from "express";
import {
  CheckoutController,
  ParticipantController,
  CouponController,
} from "./infrastructure/http/controllers";
import {
  CheckoutService,
  ParticipantService,
  CouponService,
} from "./infrastructure/http/services";
import {
  CreateCheckoutUseCase,
  CreateManualCheckoutUseCase,
  WebhookMercadoPagoUseCase,
} from "./domain/usecases";

// import { MercadoPagoProva } from "../prova/MercadoPagoProva";
// import { SimpleMercadoPagoWebhook } from "../prova/WebhookProva";

import { FirebaseCheckoutRepository } from "./infrastructure/repositories";
import { FirebaseParticipantRepository } from "./infrastructure/repositories";
import { FirebaseCouponRepository } from "./infrastructure/repositories";

import cors from "cors";
import { config } from "dotenv";
config();

const app = express();

app.use(cors());
app.use(express.json());

// Configurar dependências
const checkoutRepository = new FirebaseCheckoutRepository();
const participantRepository = new FirebaseParticipantRepository();
const couponRepository = new FirebaseCouponRepository();

const createCheckoutUseCase = new CreateCheckoutUseCase(
  checkoutRepository,
  participantRepository,
  couponRepository
);
const createManualCheckoutUseCase = new CreateManualCheckoutUseCase(
  checkoutRepository,
  participantRepository
);
const webhookUseCase = new WebhookMercadoPagoUseCase(
  checkoutRepository,
  participantRepository
);
const checkoutService = new CheckoutService(
  createCheckoutUseCase,
  createManualCheckoutUseCase,
  webhookUseCase,
  checkoutRepository
);
const couponService = new CouponService(couponRepository);
const checkoutController = new CheckoutController(checkoutService);
const couponController = new CouponController(couponService);
const participantService = new ParticipantService(
  participantRepository,
  checkoutRepository
);
const participantController = new ParticipantController(participantService);

// Rotas
app.post("/checkout", (req: Request, res: Response) =>
  checkoutController.createCheckout(req, res)
);
app.post("/checkout/manual", (req: Request, res: Response) =>
  checkoutController.createManualCheckout(req, res)
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
app.post("/coupons/validate", (req: Request, res: Response) =>
  couponController.validateCoupon(req, res)
);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
