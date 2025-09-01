import { Router } from "express";
import { ParticipantController } from "../http/controllers";
import { ParticipantService } from "../http/services";
import {
  FirebaseParticipantRepository,
  FirebaseCheckoutRepository,
} from "../repositories";

const router = Router();
const participantRepository = new FirebaseParticipantRepository();
const checkoutRepository = new FirebaseCheckoutRepository();
const participantService = new ParticipantService(
  participantRepository,
  checkoutRepository
);
const controller = new ParticipantController(participantService);

router.get("/:document", controller.getParticipantByDocument.bind(controller));
router.post("/validate-qr", controller.validateQRCode.bind(controller));
router.get(
  "/:participantId/certificate",
  controller.getCertificate.bind(controller)
);
router.put("/:uid", controller.updateParticipant.bind(controller));

export { router as participantRoutes };
