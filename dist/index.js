"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("./infrastructure/http/controllers");
const services_1 = require("./infrastructure/http/services");
const usecases_1 = require("./domain/usecases");
// import { MercadoPagoProva } from "../prova/MercadoPagoProva";
// import { SimpleMercadoPagoWebhook } from "../prova/WebhookProva";
const repositories_1 = require("./infrastructure/repositories");
const repositories_2 = require("./infrastructure/repositories");
const repositories_3 = require("./infrastructure/repositories");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configurar dependências
const checkoutRepository = new repositories_1.FirebaseCheckoutRepository();
const participantRepository = new repositories_2.FirebaseParticipantRepository();
const couponRepository = new repositories_3.FirebaseCouponRepository();
const createCheckoutUseCase = new usecases_1.CreateCheckoutUseCase(checkoutRepository, participantRepository, couponRepository);
const createManualCheckoutUseCase = new usecases_1.CreateManualCheckoutUseCase(checkoutRepository, participantRepository);
const webhookUseCase = new usecases_1.WebhookMercadoPagoUseCase(checkoutRepository, participantRepository);
const checkoutService = new services_1.CheckoutService(createCheckoutUseCase, createManualCheckoutUseCase, webhookUseCase, checkoutRepository);
const couponService = new services_1.CouponService(couponRepository);
const checkoutController = new controllers_1.CheckoutController(checkoutService);
const couponController = new controllers_1.CouponController(couponService);
const participantService = new services_1.ParticipantService(participantRepository, checkoutRepository);
const participantController = new controllers_1.ParticipantController(participantService);
// Rotas
app.post("/checkout", (req, res) => checkoutController.createCheckout(req, res));
app.post("/checkout/manual", (req, res) => checkoutController.createManualCheckout(req, res));
app.post("/webhook/mercadopago", (req, res) => checkoutController.handleWebhook(req, res));
app.get("/checkout/:id", (req, res) => checkoutController.getCheckoutById(req, res));
app.get("/participant/:document", (req, res) => participantController.getParticipantByDocument(req, res));
app.post("/participant/validate-qr", (req, res) => participantController.validateQRCode(req, res));
app.get("/participant/:participantId/certificate", (req, res) => participantController.getCertificate(req, res));
app.post("/coupons/validate", (req, res) => couponController.validateCoupon(req, res));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map