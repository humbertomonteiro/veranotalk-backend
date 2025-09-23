"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.participantRoutes = void 0;
const express_1 = require("express");
const controllers_1 = require("../http/controllers");
const services_1 = require("../http/services");
const repositories_1 = require("../repositories");
const router = (0, express_1.Router)();
exports.participantRoutes = router;
const participantRepository = new repositories_1.FirebaseParticipantRepository();
const checkoutRepository = new repositories_1.FirebaseCheckoutRepository();
const participantService = new services_1.ParticipantService(participantRepository, checkoutRepository);
const controller = new controllers_1.ParticipantController(participantService);
router.get("/:document", controller.getParticipantByDocument.bind(controller));
router.post("/validate-qr", controller.validateQRCode.bind(controller));
router.get("/:participantId/certificate", controller.getCertificate.bind(controller));
router.put("/:uid", controller.updateParticipant.bind(controller));
//# sourceMappingURL=participantRoutes.js.map