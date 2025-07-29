"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRoutes = createRoutes;
const express_1 = require("express");
// import { WebhookController } from "../controllers/Webhook.controller";
const Checkout_routes_1 = require("./Checkout.routes");
// import { createWebhookRoutes } from "./webhook.routes";
function createRoutes(checkoutController
// webhookController: WebhookController
) {
    const router = (0, express_1.Router)();
    router.use((0, Checkout_routes_1.createCheckoutRoutes)(checkoutController));
    // router.use(createWebhookRoutes(webhookController));
    return router;
}
//# sourceMappingURL=index.routes.js.map