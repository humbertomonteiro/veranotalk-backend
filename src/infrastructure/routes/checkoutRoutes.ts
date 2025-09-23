import { Router } from "express";
import { CheckoutService } from "../http/services";
import {
  CreateCheckoutUseCase,
  CreateManualCheckoutUseCase,
  WebhookMercadoPagoUseCase,
  DeleteCheckoutUseCase,
} from "../../domain/usecases";
import { CheckoutController } from "../http/controllers";
import {
  FirebaseCheckoutRepository,
  FirebaseParticipantRepository,
  FirebaseCouponRepository,
  FirebaseUserRepository,
} from "../repositories";

const router = Router();
const checkoutRepository = new FirebaseCheckoutRepository();
const participantRepository = new FirebaseParticipantRepository();
const couponRepository = new FirebaseCouponRepository();
const userRepository = new FirebaseUserRepository();

const createCheckout = new CreateCheckoutUseCase(
  checkoutRepository,
  participantRepository,
  couponRepository
);
const createManualCheckout = new CreateManualCheckoutUseCase(
  checkoutRepository,
  participantRepository,
  couponRepository,
  userRepository
);
const webhookMercadoPago = new WebhookMercadoPagoUseCase(
  checkoutRepository,
  participantRepository,
  couponRepository
);
const deleteCheckout = new DeleteCheckoutUseCase(
  checkoutRepository,
  participantRepository
);

const checkoutService = new CheckoutService(
  createCheckout,
  createManualCheckout,
  webhookMercadoPago,
  checkoutRepository,
  deleteCheckout
);

const controller = new CheckoutController(checkoutService);

router.post("/", controller.createCheckout.bind(controller));
router.post("/manual", controller.createManualCheckout.bind(controller));
router.post("/mercadopago", controller.handleWebhook.bind(controller));
router.delete("/:id", controller.deleteCheckout.bind(controller));
router.get("/:id", controller.getCheckoutById.bind(controller));

export { router as checkoutRoutes };
