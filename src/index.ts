import express, { Request, Response } from "express";
import { CheckoutController } from "./infrastructure/http/controllers/Checkout.controller";
import { CheckoutService } from "./infrastructure/http/services/Checkout.service";
import { CreateCheckoutUseCase } from "./domain/usecases/CreateCheckout.usecase";
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
const checkoutService = new CheckoutService(createCheckoutUseCase);
const checkoutController = new CheckoutController(
  checkoutService,
  checkoutRepository,
  participantRepository
);

// Rotas
app.post("/checkout", (req: Request, res: Response) =>
  checkoutController.createCheckout(req, res)
);
app.post("/webhook/mercadopago", (req: Request, res: Response) =>
  checkoutController.handleWebhook(req, res)
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
