"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCheckoutRoutes = createCheckoutRoutes;
const express_1 = require("express");
function createCheckoutRoutes(checkoutController) {
    const router = (0, express_1.Router)();
    router.post("/create-checkout", (req, res) => checkoutController.createCheckout(req, res));
    return router;
}
//# sourceMappingURL=Checkout.routes.js.map