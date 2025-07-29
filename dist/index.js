"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const Checkout_controller_1 = require("./infrastructure/http/controllers/Checkout.controller");
const Checkout_service_1 = require("./infrastructure/http/services/Checkout.service");
const CreateCheckout_usecase_1 = require("./domain/usecases/CreateCheckout.usecase");
const repositories_1 = require("./infrastructure/repositories");
const repositories_2 = require("./infrastructure/repositories");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Configurar dependências
const checkoutRepository = new repositories_1.FirebaseCheckoutRepository();
const participantRepository = new repositories_2.FirebaseParticipantRepository();
const createCheckoutUseCase = new CreateCheckout_usecase_1.CreateCheckoutUseCase(checkoutRepository, participantRepository);
const checkoutService = new Checkout_service_1.CheckoutService(createCheckoutUseCase);
const checkoutController = new Checkout_controller_1.CheckoutController(checkoutService, checkoutRepository, participantRepository);
// Rotas
app.post("/checkout", (req, res) => checkoutController.createCheckout(req, res));
app.post("/webhook/mercadopago", (req, res) => checkoutController.handleWebhook(req, res));
app.get("/checkout/:id", (req, res) => checkoutController.getCheckoutById(req, res));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=index.js.map