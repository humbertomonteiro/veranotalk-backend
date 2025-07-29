"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeDependencies = composeDependencies;
const Checkout_controller_1 = require("./infrastructure/http/controllers/Checkout.controller");
const Webhook_controller_1 = require("./infrastructure/http/controllers/Webhook.controller");
const CreateCheckout_usecase_1 = require("./domain/usecases/CreateCheckout.usecase");
const ProcessWebhookUseCase_1 = require("./domain/usecases/ProcessWebhookUseCase");
const CreateCheckout_service_1 = require("./application/services/CreateCheckout.service");
const FirebaseCheckout_repository_1 = require("./infrastructure/repositories/FirebaseCheckout.repository");
const FirebaseParticipant_repository_1 = require("./infrastructure/repositories/FirebaseParticipant.repository");
const FirebaseMercadoPago_repository_1 = require("./infrastructure/repositories/FirebaseMercadoPago.repository");
function composeDependencies() {
    // Repositórios
    const checkoutRepository = new FirebaseCheckout_repository_1.FirebaseCheckoutRepository();
    const participantRepository = new FirebaseParticipant_repository_1.FirebaseParticipantRepository();
    const mercadoPagoRepository = new FirebaseMercadoPago_repository_1.FirebaseMercadoPagoRepository();
    // Casos de uso
    const createCheckoutUseCase = new CreateCheckout_usecase_1.CreateCheckoutUseCaseImpl(checkoutRepository, participantRepository, mercadoPagoRepository);
    const processWebhookUseCase = new ProcessWebhookUseCase_1.ProcessWebhookUseCaseImpl(checkoutRepository, participantRepository, mercadoPagoRepository);
    // Serviços
    const createCheckoutService = new CreateCheckout_service_1.CreateCheckoutService(createCheckoutUseCase);
    // Controllers
    const checkoutController = new Checkout_controller_1.CheckoutController(createCheckoutService);
    const webhookController = new Webhook_controller_1.WebhookController(processWebhookUseCase);
    return {
        checkoutController,
        webhookController,
    };
}
//# sourceMappingURL=composition-root.js.map